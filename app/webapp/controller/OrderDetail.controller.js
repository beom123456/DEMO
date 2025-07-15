

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, JSONModel, formatter, MessageBox, MessageToast) {
    "use strict";
    
    return Controller.extend("project1.controller.OrderDetail", {
        formatter: formatter,
        onInit: function () {
            const myRoute = this.getOwnerComponent().getRouter().getRoute("OrderDetail");
            myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);

            const previewModel = new JSONModel({});
            this.getView().setModel(previewModel,"preview");

        },
        onMyRoutePatternMatched: async function(oEvent){
            const selectedNum = oEvent.getParameter("arguments").num;

            const oView = this.getView();
            

            oView.bindElement({
                path: `/Request(${selectedNum})`,
                model: "RequestModel",
                events:{
                    dataRequested: function(){
                        oView.setBusy(true);
                    },
                    dataReceived: function(){
                        oView.setBusy(false);
                    }
                }
            });
        },

        //승인
        onApprove: async function () {
            const that = this;

                MessageBox.confirm("승인하시겠습니까?",{
                title: "승인 확인",
                actions:[MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.YES,
                onClose: async function (oAction){
                    if(oAction === MessageBox.Action.YES){
                        const oView = that.getView();
                        const oContext = oView.getBindingContext("RequestModel");
                        
                        if(!oContext){
                            MessageBox.error("데이터를 찾을 수 없습니다.");
                            return;
                        }

                        oContext.setProperty("request_state", "Approved");

                        try{
                            await oContext.patch();
                            MessageToast.show("승인이 완료되었습니다.");
                            that.onBack();
                        }catch(err){
                            MessageBox.error("승인중 오류가 발생했습니다" + err.message);
                        } finally{
                            oView.setBusy(false);
                        }

                    }else{
                        MessageToast.show("승인이 취소되었습니다.");
                    }
                }
            });
        },

        // 뒤로가기
        onBack: function () {
            this.getOwnerComponent().getRouter().navTo("Routeapp");
        },

        //반려
        onReject : function(){
            var oView = this.getView();
            if(!this.nameDialog){
                this.nameDialog = sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "project1.view.fragment.OrderRejectDialog",
                    controller: this
                }).then(function (oDialog){
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this.nameDialog.then(function (oDialog){
                oDialog.open();
            });
        },

        //반려사유 입력
        inInputRejectReasen: async function () {
            const rejectReason = this.getView().byId("RejectReason").getValue().trim();
        
           
            if (!rejectReason) {
                sap.m.MessageToast.show("반려 사유를 입력해주세요.");
                this.getView().byId("RejectReason").setValueState("Error");
                this.getView().byId("RejectReason").setValueStateText("반려 사유는 필수입니다.");
                return;
            }
        
            this.getView().byId("RejectReason").setValueState("None"); // 상태 초기화
        
            const oContext = oView.getBindingContext("RequestModel");

            oContext.setProperty("request_state", "Reject");
            oContext.setProperty("request_reject_reason", rejectReason);

            try{
                await oContext.patch();
                MessageToast.show()
            }catch(err){
                MessageBox.error("반려 처리 중 오류가 발생했습니다. " + err.message);
            }
            
        }
        ,
        onCancelRejectReason: function() {
            this.byId("orderRejectDialog").destroy();
            this.nameDialog=null;
            this.byId("orderRejectDialog").close();

        },
       
        onFormatCurrencyInput: function (oEvent) {
            let sValue = oEvent.getParameter("value");
          
            // 숫자 이외 제거
            sValue = sValue.replace(/[^\d]/g, "");
          
            // 천 단위 콤마 추가
            const formatted = sValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          
            // 커서 이동 없이 바로 값 변경
            oEvent.getSource().setValue(formatted);

            this.onCalculateTotalPrice();
        },
        onValidateInput: function (oEvent) {
            let sValue = oEvent.getParameter("value");
        
            // 숫자(0~9) 제거
            sValue = sValue.replace(/[^\w\sㄱ-ㅎ가-힣]|[\d]/g, "");   
            oEvent.getSource().setValue(sValue);

            this.onCalculateTotalPrice();
        },
        
        onPreviousRequest: function () {
            this._navigateToSiblingRequest(-1);
          },
          
          onNextRequest: function () {
            this._navigateToSiblingRequest(1);
          },
          
          _navigateToSiblingRequest: async function (offset) {
            try {
            
              const currentNumber = parseInt(this.byId("Req").getText());
              
          
              const response = await $.ajax({
                type: "GET",
                url: "/odata/v4/request/Request?$orderby=request_number"
              });
          
              const requests = response.value;
          
              const currentIndex = requests.findIndex(item => item.request_number === currentNumber);
              const nextIndex = currentIndex + offset;
          
              if (nextIndex < 0 || nextIndex >= requests.length) {
                sap.m.MessageToast.show("이동할 요청이 없습니다.");
                return;
              }
          
              const nextRequestNum = requests[nextIndex].request_number;
          
              this.getOwnerComponent().getRouter().navTo("OrderDetail", { num: nextRequestNum });
          
            } catch (err) {
              sap.m.MessageToast.show("요청 이동 실패: " + err.statusText);
            }
          },

          //삭제
          onDeleteRequest: async function () {
            const that = this;
            let oView = this.getView();
            let oModel = this.getView().getModel("RequestModel");
            let oContext = oView.getBindingContext("RequestModel");
            
        
            sap.m.MessageBox.confirm(
                "삭제하시겠습니까?\n삭제 후 데이터 복원이 불가능합니다.",
                {
                    title: "삭제 확인",
                    actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                    emphasizedAction: sap.m.MessageBox.Action.OK,
                    onClose: async (sAction) => {
                        if (sAction === sap.m.MessageBox.Action.OK) {
                           oContext.delete().then(() =>{
                            oModel.refresh();
                            MessageToast.show("삭제되었습니다.");
                            that.onBack();
                           }).catch((oError) =>{
                            MessageToast.show("삭제실패 :" +oError.message);                           })
                        }
                    }
                }
            );
        },
        onNavToEditPage: function () {
            const oRequestNumber = this.byId("Req").getText();  // 상세 페이지의 요청번호 가져오기
            if (oRequestNumber) {
                this.getOwnerComponent().getRouter().navTo("EditRequest", { num: oRequestNumber });
            } else {
                MessageToast.show("요청 번호를 찾을 수 없습니다.");
            }
        }
        
        



    });
});
