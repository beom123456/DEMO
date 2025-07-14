sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("project1.controller.OrderEdit", {
        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("EditRequest").attachPatternMatched(this._onPatternMatched, this);
        },

        _onPatternMatched: async function (oEvent) {
            const num = oEvent.getParameter("arguments").num;
            this._requestNumber = num; // 요청 번호를 인스턴스 변수에 저장

            const url = "/odata/v4/request/Request(" + num + ")";
            try {
                const oData = await $.ajax({
                    url: url,
                    type: "GET"
                });

                const model = new JSONModel(oData);
                this.getView().setModel(model, "EditModel");

                this.byId("EditRequestNumber").setText(oData.request_number);
                this.byId("EditRequestDate").setText(oData.request_date);
                this.byId("EditProductName").setValue(oData.request_product);
                this.byId("EditProductQuantity").setValue(this._formatNumber(oData.request_quantity));
                this.byId("EditEstimatedPrice").setValue(this._formatNumber(oData.request_estimated_price));
                this.byId("EditRequestor").setValue(oData.requestor);
                this.byId("EditReason").setValue(oData.request_reason);
                this.byId("TotalPriceTextEdit").setText(this._formatNumber(oData.request_total_price) + " 원");
            } catch (err) {
                MessageToast.show("요청 정보를 불러오는 데 실패했습니다.");
            }
        },

        _formatNumber: function (value) {
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },

        _parseNumber: function (value) {
            return parseInt(value.replace(/,/g, ""), 10);
        },

        onBack: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            const num = this._requestNumber; // 저장된 요청 번호 사용
            oRouter.navTo("OrderDetail", { num: num });
        },

        onSubmitEdit: function () {
            MessageBox.confirm("정말로 요청을 수정하시겠습니까? \n요청 마감시간은 16시입니다. 이후 요청은 익일 처리됩니다." , {
              title: "요청 생성 확인",
              actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
              emphasizedAction: MessageBox.Action.OK,
              onClose: async function (oAction) {
                if (oAction === MessageBox.Action.OK) {
                  await this.submitEdit(); 
                }
              }.bind(this)
            });
        },

        submitEdit: async function () {

            const requiredInputs = [
                { id: "EditProductName", name: "요청 물품" },
                { id: "EditProductQuantity", name: "요청 수량",numeric:true },
                { id: "EditRequestor", name: "요청자" },
                { id: "EditReason", name: "요청 사유" },
                { id: "EditEstimatedPrice", name: "요청 가격", numeric:true}
            ];

            for (let field of requiredInputs) {
                const input = this.byId(field.id);
                const value = input.getValue().trim();
            
                if (!value) {
                    input.setValueState("Error");
                    input.setValueStateText(`${field.name}은(는) 필수 입력입니다.`);
                    return;
                }               
                if (field.numeric) {
                    const numericValue = parseInt(value, 10);
                    if (isNaN(numericValue) || numericValue <= 0) {
                        input.setValueState("Error");
                        input.setValueStateText(`${field.name}은(는) 1개 이상 이여야 합니다.`);
                        return;
                    }
                }
                input.setValueState("None");
            }


            const data = this.getView().getModel("EditModel").getData();

            data.request_product = this.byId("EditProductName").getValue();
            data.request_quantity = this._parseNumber(this.byId("EditProductQuantity").getValue());
            data.request_estimated_price = this._parseNumber(this.byId("EditEstimatedPrice").getValue());
            data.request_total_price = data.request_quantity * data.request_estimated_price;
            data.requestor = this.byId("EditRequestor").getValue();
            data.request_reason = this.byId("EditReason").getValue();

            try {
                await $.ajax({
                    url: "/odata/v4/request/Request(" + data.request_number + ")",
                    type: "PATCH",
                    contentType: "application/json",
                    data: JSON.stringify(data)
                });

                MessageToast.show("수정이 완료되었습니다.");
                const oRouter = this.getOwnerComponent().getRouter();
                const num = this._requestNumber; 
                oRouter.navTo("OrderDetail", { num: num });
            } catch (err) {
                MessageToast.show("수정 실패: " + err.statusText);
            }
        },

        onClearField: function () {
            this.byId("EditProductName").setValue("");
            this.byId("EditProductQuantity").setValue("");
            this.byId("EditEstimatedPrice").setValue("");
            this.byId("EditRequestor").setValue("");
            this.byId("EditReason").setValue("");
            this.byId("TotalPriceTextEdit").setText("0 원");
        },

        onPreview: function () {
            const oData = this.getView().getModel("EditModel").getData();
            const previewModel = new JSONModel({
                ReqNumber: oData.request_number,
                ReqDay: oData.request_date,
                ReqGoods: oData.request_product,
                ReqQuantity: oData.request_quantity,
                ReqPrice: oData.request_estimated_price,
                TotalPrice: oData.request_total_price,
                Requestor: oData.requestor,
                Reason: oData.request_reason
            });
            this.getView().setModel(previewModel, "preview");
        },

        onFormatCurrencyInput: function (oEvent) {
            let sValue = oEvent.getParameter("value");
            sValue = sValue.replace(/[^\d]/g, "");
            const formatted = sValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            oEvent.getSource().setValue(formatted);
            this._updateTotalPrice();
        },

        onValidateInput: function (oEvent) {
            let sValue = oEvent.getParameter("value");
            sValue = sValue.replace(/[^\w\sㄱ-ㅎ가-힣]|[\d]/g, "");
            oEvent.getSource().setValue(sValue);
        },

        _updateTotalPrice: function () {
            const qty = this._parseNumber(this.byId("EditProductQuantity").getValue());
            const price = this._parseNumber(this.byId("EditEstimatedPrice").getValue());

            if (!isNaN(qty) && !isNaN(price)) {
                const total = qty * price;
                this.byId("TotalPriceTextEdit").setText(total.toLocaleString() + " 원");
            } else {
                this.byId("TotalPriceTextEdit").setText("0 원");
            }
        },
        cancelBack: function () {
            MessageBox.confirm("입력 중인 데이터가 사라질 수 있습니다. 정말 취소하시겠습니까?", {
              title: "요청 취소 확인",
              actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
              emphasizedAction: MessageBox.Action.CANCEL,
              onClose: function (oAction) {
                if (oAction === MessageBox.Action.OK) {
                    const oRouter = this.getOwnerComponent().getRouter();
                    const num = this._requestNumber; 
                    oRouter.navTo("OrderDetail", { num: num });
                }
              }.bind(this) 
            });
        }
    });
});
