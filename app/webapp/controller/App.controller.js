sap.ui.define([
  "sap/ui/core/mvc/Controller"
], (BaseController) => {
  "use strict";

  return BaseController.extend("project1.controller.App", {
      onInit() {

        

      },
      onLogoPress: function () {
        this.getOwnerComponent().getRouter().navTo("Routeapp");
      },
      onCreateOrder: async function () {
        try {
          const response = await $.ajax({
            type: "GET",
            url: "/odata/v4/request/Request"
          });
      
          const data = response.value;
          const last = data[data.length - 1];
          const nextNum = last ? last.request_number + 1 : 1;
      
          this.getOwnerComponent().getRouter().navTo("CreateOrder", { num: nextNum });
      
        } catch (err) {
          sap.m.MessageToast.show("요청 번호 생성 실패: " + err.statusText);
        }
      },
      onCreateProduct: function(){
        this.getOwnerComponent().getRouter().navTo("ProductManage");
      }
    
      
  });
});