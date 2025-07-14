sap.ui.define([
    "sap/ui/core/UIComponent",
    "project1/model/models",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/resource/ResourceModel"
], (UIComponent, models, JSONModel, ResourceModel) => {
    "use strict";

    return UIComponent.extend("project1.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            //set data model
            

            // enable routing
            this.getRouter().initialize();

            var oData={
                recipient:{
                    name:"world"
                }
            }
            var oModel = new JSONModel(oData);
            this.setModel(oModel);

            //view에 i18n  모델 설정
            var i18nModel = new ResourceModel({
                bundleName: "project1.i18n.i18n"
            });
            this.setModel(i18nModel, "i18n");
        }
    });
});