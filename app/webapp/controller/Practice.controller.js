sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/resource/ResourceModel"

  ], function (Controller, MessageToast, JSONModel, ResourceModel) {
    "use strict";
  
    return Controller.extend("project1.controller.Practice", {
  
      onInit: function () {
        const oData = {
            recipient : {
               name : "World"
            }
         };
         const oModel = new JSONModel(oData);
         this.getView().setModel(oModel);


         const i18nModel = new ResourceModel({
          bundleName: "ui5.walkthrough.i18n.i18n"
       });
       this.getView().setModel(i18nModel, "i18n");
      },
  
      onGreetPress: function () {
        const oBundle = this.getView().getModel("i18n").getResourceBundle();
        const sRecipient = this.getView().getModel().getProperty("/recipient/name");
        const sMsg = oBundle.getText("helloMsg", [sRecipient]);

        
        MessageToast.show("Hello World");
      }
  
    });
  });
  