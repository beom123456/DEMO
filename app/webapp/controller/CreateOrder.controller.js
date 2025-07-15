

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",             
    "sap/ui/model/FilterOperator",      
    "sap/m/MessageToast"
    ], function (Controller, JSONModel, MessageBox, Fragment,Filter, FilterOperator, MessageToast) {
    "use strict";

    let Today, CreateNum;

    return Controller.extend("project1.controller.CreateOrder", {
        
        onInit: function(){
            const myRoute = this.getOwnerComponent().getRouter().getRoute("CreateOrder");
            myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);    
            
            const previewModel = new JSONModel({});
            this.getView().setModel(previewModel,"preview");

            let oModel = new JSONModel({
              request_number: null,
              request_product: "",
              request_quantity : "",
              requestor : "",
              request_state : "",
              reqeust_estimated_price: "",
              request_total_price: "",
              price : 0,
              unit : 0,
              request_reason: ""
            });

            this.getView().setModel(oModel, "CreateModel");
        },

        onMyRoutePatternMatched: function(){
            this.onClearField();
          

            this.getView().byId("ReqNumber").setText(CreateNum);
            this.getView().byId("ReqDay").setText(Today);
            
        },

        onBack: function(){
            this.getOwnerComponent().getRouter().navTo("Routeapp");
        },
        //미리보기
        onPreview: function () {
            const oView = this.getView();
          
            const previewData = {
                ReqNumber: oView.byId("ReqNumber").getText(),
                ReqDay: oView.byId("ReqDay").getText(),
                ReqGoods: oView.byId("ReqGoods").getValue(),
                ReqQuantity: parseInt(oView.byId("ReqQuantity").getValue()),
                ReqPrice: oView.byId("ReqPrice").getValue(),
                TotalPrice: oView.byId("TotalPriceText").getText(),
                Requestor: oView.byId("Requestor").getValue(),
                Reason: oView.byId("Reason").getValue()
            };
                
            this.getView().getModel("preview").setData(previewData);
        },

        //물품 생성
        onCreate: function () {
            MessageBox.confirm("정말로 요청을 생성하시겠습니까?"  , {
              title: "요청 생성 확인",
              actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
              emphasizedAction: MessageBox.Action.OK,
              onClose: async function (oAction) {
                if (oAction === MessageBox.Action.OK) {
                  await this.createRequest(); 
                }
              }.bind(this)
            });
          },

         createRequest : async function(){
          const oData = this.getView().getModel("CreateModel").getData();
          const oDataModel = this.getOwnerComponent().getModel("RequestModel");
          const oListBinding = oDataModel.bindList("/Request", undefined, [new sap.ui.model.Sorter("request_number", true)]);
          
          let nextNumber = 1;

          try {
            const aContexts = await oListBinding.requestContexts(0,1);
            if(aContexts.length > 0){
              const oLast = aContexts[0].getObject();
              const lastNumber = parseInt(oLast.request_number,10);
              if(!isNaN(lastNumber)){
                nextNumber = lastNumber +1;
              }
            }
          }catch (e){
            console.warn("request_number 계산 실패, 1로 초기화", e);
          }

          try {
            const oCreateBinding = oDataModel.bindList("/Request");
            const estimated_price = parseInt(oData.request_estimated_price.replace(/,/g,""),10) || 0;
            const request_quantity = parseInt(oData.request_quantity.replace(/,/g,""),10) ||0;

            await oCreateBinding.create({
              request_number: nextNumber,
              request_product: oData.request_product,
              request_quantity: request_quantity,
              requestor: oData.requestor,
              request_state: oData.request_state,
              request_estimated_price: estimated_price,
              request_total_price: request_quantity * estimated_price,
              request_state: "In Progress",
              request_reason: oData.request_reason
            
            }).created();
        
            sap.m.MessageToast.show("요청이 성공적으로 생성되었습니다.");
            oDataModel.refresh(); 
            this.onClearField();
            this.getOwnerComponent().getRouter().navTo("Routeapp");
          } catch (err) {
            console.error("생성 실패", err);
            sap.m.MessageBox.error("요청 생성 중 오류가 발생했습니다.");
          }


           
        },
        //문자x
        onValidateTextInput: function (oEvent) {
            let sValue = oEvent.getParameter("value");
            sValue = sValue.replace(/[^\d]/g, "");
            const formatted = sValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            oEvent.getSource().setValue(formatted);
            this.onCalculateTotalPrice();
        },
        //숫자x
        onValidateInput: function (oEvent) {
            let sValue = oEvent.getParameter("value");
        
            // 숫자(0~9) 제거
            sValue = sValue.replace(/[^\w\sㄱ-ㅎ가-힣]|[\d]/g, "");   
            oEvent.getSource().setValue(sValue);
            
        },
        //글자x 원화단위
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
        onBack: function () {
            this.getOwnerComponent().getRouter().navTo("Routeapp");
        },
        //취소버튼
        cancelBack: function () {
            MessageBox.confirm("입력 중인 데이터가 사라질 수 있습니다. 정말 취소하시겠습니까?", {
              title: "요청 취소 확인",
              actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
              emphasizedAction: MessageBox.Action.CANCEL,
              onClose: function (oAction) {
                if (oAction === MessageBox.Action.OK) {
                  this.getOwnerComponent().getRouter().navTo("Routeapp");
                }
              }.bind(this) 
            });
        },
        onClearField: function(){
            this.getView().getModel("CreateModel").setData({
              request_product: "",
              unit: "",
              price: 0,
              request_quantity: null,
              requestor: "",
              request_state: "",
              request_estimated_price: null,
              request_total_price: 0
            });

            this.getView().getModel("preview").setData({});

            
      
        },
        //개당가격 x 갯수
        onCalculateTotalPrice: function () {
          const oModel = this.getView().getModel("CreateModel");
          const qtyStr = oModel.getProperty("/request_quantity");
          const priceStr = oModel.getProperty("/request_estimated_price");

          const qty = Number(String(qtyStr).replace(/,/g, ""));
          const price = Number(String(priceStr).replace(/,/g, ""));

          const total = (!isNaN(qty) && !isNaN(price)) ? qty * price : 0;
          this.byId("TotalPriceText").setValue(total.toLocaleString()+ "원");

            
        },
        onLoadLastRequest: async function () {
            const oView = this.getView();
        
            try {
                const oData = await $.ajax({
                    url: "/odata/v4/request/Request?$orderby=request_number desc&$top=1",
                    method: "GET"
                });
        
                if (oData.value && oData.value.length > 0) {
                    const latest = oData.value[0];
        
                    oView.byId("ReqNumber").setText(latest.request_number);
                    oView.byId("ReqDay").setText(latest.request_date);
                    oView.byId("ReqGoods").setValue(latest.request_product);
                    oView.byId("ReqQuantity").setValue(latest.request_quantity);
                    oView.byId("ReqPrice").setValue(latest.request_estimated_price);
                    oView.byId("TotalPriceText").setText(latest.request_total_price + " 원");
                    oView.byId("Requestor").setValue(latest.requestor);
                    oView.byId("Reason").setValue(latest.request_reason);
                } else {
                    MessageToast.show("최근 요청 데이터를 찾을 수 없습니다.");
                }
            } catch (error) {
                console.error("최근 요청 불러오기 실패:", error);
                MessageBox.error("최근 요청을 불러오는 중 오류가 발생했습니다.");
            }
        },
        onOpenProductDialog: function () {
            const oView = this.getView();
            if (!this.pDialog) {
              this.pDialog = Fragment.load({
                id: oView.getId(),
                name: "project1.view.fragment.ProductSelectDialog",
                controller: this
              }).then(function (oDialog) {
                oView.addDependent(oDialog);
                oDialog.open();
                return oDialog;
              });
            } else {
              this.pDialog.then(function (oDialog) {
                oDialog.open();
              });
            }
          },
      
          // 다이얼로그 닫기
          onCloseProductDialog: function () {
            this.byId("ProductSelectDialog").close();
          },
      
          // 상품 선택
          onSelectProduct: function (oEvent) {
            const oItem = oEvent.getParameter("listItem");
            const oCtx = oItem.getBindingContext("ProductModel");
            const oData = oCtx.getObject();
      
           const oRequestModel = this.getView().getModel("CreateModel");
           const data = oRequestModel.getData();

           data.request_product = oData.name;
           data.price = oData.price;
           data.unit = oData.unit;

           oRequestModel.refresh(true);

           MessageToast.show("상품 선택됨: " + oData.name);

           this.byId("ProductSelectDialog").close();

          },
      
          // 상품 검색
          onSearchProduct: function (oEvent) {
            const sQuery = oEvent.getSource().getValue();
            const oList = this.byId("ProductList");
            const oBinding = oList.getBinding("items");
            const aFilters = sQuery
              ? [new Filter("name", FilterOperator.Contains, sQuery)]
              : [];
            oBinding.filter(aFilters);
          }
        
    });
});