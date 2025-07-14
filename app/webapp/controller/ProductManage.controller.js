sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("project1.controller.ProductManage", {
    onInit: function () {
      
      const oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("ProductManage").attachPatternMatched(this.onMyRoutePatternMatched, this);
      
     
    },
    onMyRoutePatternMatched: function() {
      const oList = this.byId("productCardGrid");
      const oBinding = oList.getBinding("items");
      if (oBinding) {
        oBinding.refresh();
        const oSorter = new sap.ui.model.Sorter("product_id", true); // ID 기준 내림차순
        oBinding.sort([oSorter]);  
      }
    },

    

    onCreateProduct: async function () {
      this.getOwnerComponent().getRouter().navTo("CreateProduct");
    },

    //상품 삭제
    onDeleteProduct: async function(oEvent){
      let oButton = oEvent.getSource();
      let oContext = oButton.getBindingContext("ProductModel");

      if(!oContext){
        MessageToast.show("삭제할 제품 정보를 찾을 수 없습니다.");
        return;
      }

     try{
      await oContext.delete();
       MessageToast.show("제품이 삭제되었습니다.");
      }catch(oError){
       MessageToast.show("삭제 중 오류가 발생했습니다.");
       console.error(oError);
     }
    },


  });
});
