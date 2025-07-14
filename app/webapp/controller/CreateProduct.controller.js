sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/ui/model/Sorter",
  "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, Sorter, MessageBox) {
  "use strict";

  return Controller.extend("project1.controller.CreateProduct", {

    onInit: function () {
     

      const oPreviewModel = new JSONModel({});
      this.getView().setModel(oPreviewModel, "preview");
    },

    onPreview: function () {
      const name = this.byId("ProductName").getValue();
      const unit = this.byId("ProductUnit").getValue();
      const price = this.byId("ProductPrice").getValue();
      const qty = this.byId("ProductMaxQty").getValue();
      const note = this.byId("ProductNote").getValue();
      const image = this.base64Image || "";
    
      // 미리보기 UI에 직접 설정
      this.byId("PreviewName").setText("물품명: " + name);
      this.byId("PreviewUnit").setText("단위: " + unit);
      this.byId("PreviewPrice").setText("단가: " + price);
      this.byId("PreviewQty").setText("최대 수량: " + qty);
      this.byId("PreviewNote").setText("비고: " + note);
      this.byId("PreviewImage").setSrc(image);
    
      MessageToast.show("미리보기 완료");
    },

    onClear: function () {
      this.byId("ProductName").setValue("");
      this.byId("ProductUnit").setValue("");
      this.byId("ProductPrice").setValue("");
      this.byId("ProductMaxQty").setValue("");
      this.byId("ProductNote").setValue("");
      this.byId("ProductImageUploader").clear();
      this.base64Image = "";
    
      // 미리보기 영역도 초기화
      this.byId("PreviewName").setText("");
      this.byId("PreviewUnit").setText("");
      this.byId("PreviewPrice").setText("");
      this.byId("PreviewQty").setText("");
      this.byId("PreviewNote").setText("");
      this.byId("PreviewImage").setSrc("");
    },

    onCreate: async function () {
      const name = this.byId("ProductName").getValue().trim();
      const unit = this.byId("ProductUnit").getValue().trim();
      const price = parseInt(this.byId("ProductPrice").getValue().replace(/,/g, ""), 10);
      const maxQty = parseInt(this.byId("ProductMaxQty").getValue().replace(/,/g, ""), 10);
      const note = this.byId("ProductNote").getValue().trim();
      const image = this.uploadedImageUrl || "";

      if (!name || !unit || isNaN(price) || isNaN(maxQty)) {
        MessageToast.show("모든 필드를 올바르게 입력하세요.");
        return;
      }

      MessageBox.confirm("해당 물품을 등록하시겠습니까?", {
        title: "물품 등록 확인",
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.OK,
        onClose: async function (oAction) {
          if (oAction === MessageBox.Action.OK) {
            await this._createProduct(name, unit, price, maxQty, note, image);
          }
        }.bind(this)
      });
    },

    _createProduct: async function (name, unit, price, maxQty, note, image) {
      const oModel = this.getView().getModel("ProductModel");
      let nextId = 1;

      try {
        const oBinding = oModel.bindList("/Products", undefined, [new Sorter("product_id", true)]);
        const aContexts = await oBinding.requestContexts(0, 1);
        if (aContexts.length > 0) {
          const oLast = aContexts[0].getObject();
          const id = parseInt(oLast.product_id, 10);
          if (!isNaN(id)) nextId = id + 1;
        }
      } catch (e) {
        console.warn("ID 계산 실패, 기본값 1 사용", e);
      }

      try {
        const oCreateBinding = oModel.bindList("/Products");
        await oCreateBinding.create({
          product_id: nextId,
          name: name,
          unit: unit,
          price: price,
          maxQty: maxQty,
          image: image,
          note: note,
          createdAt: new Date().toISOString()
        });
        MessageToast.show("물품이 등록되었습니다.");
        this.onClear();
        this.getOwnerComponent().getRouter().navTo("ProductManage");
      } catch (error) {
        MessageToast.show("등록 실패: " + error.message);
      }
    },

    onCancel: function () {
      MessageBox.confirm("입력 중인 내용이 사라질 수 있습니다. 취소하시겠습니까?", {
        title: "작업 취소",
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.CANCEL,
        onClose: function (oAction) {
          if (oAction === MessageBox.Action.OK) {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("ProductManage");
          }
        }.bind(this)
      });
    },

    onBack: function () {
      this.onCancel();
    },
    onImageUpload: function () {
      this.byId("ProductImageUploader").upload();
    },
    onUploadComplete: function (oEvent) {
      const response = JSON.parse(oEvent.getParameter("responseRaw"));
      if (response && response.path) {
        this.uploadedImageUrl = response.path; // 모델 저장 대신 변수 저장
        sap.m.MessageToast.show("이미지 업로드 성공");
      } else {
        sap.m.MessageToast.show("업로드 실패");
      }
    },
    
    onValidateTextInput: function (oEvent) {
      let sValue = oEvent.getParameter("value").replace(/[^\d]/g, "");
      const formatted = sValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      oEvent.getSource().setValue(formatted);
    },

    onFormatCurrencyInput: function (oEvent) {
      let sValue = oEvent.getParameter("value").replace(/[^\d]/g, "");
      const formatted = sValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      oEvent.getSource().setValue(formatted);
    },
    

  });
});
