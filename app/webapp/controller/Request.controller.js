

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/model/Sorter",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (Controller, formatter, Filter, FilterOperator, Fragment, Sorter, JSONModel, MessageBox) {
    "use strict";
    
    return Controller.extend("project1.controller.Request", {
        formatter: formatter,

        onInit: function () {
            const myRoute = this.getOwnerComponent().getRouter().getRoute("Routeapp");
            myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);
            
            

        },

        onMyRoutePatternMatched: async function () {
            this.onClearField();    
        },

        //검색 필드 초기화
        onClearField: async function () {
            this.getView().byId("ReqNum").setValue("");
            this.getView().byId("ReqGood").setValue("");
            this.getView().byId("StartDate").setValue("");
            this.getView().byId("EndDate").setValue("");
            this.getView().byId("ReqStatus").setSelectedKey("");
            this.getView().byId("price").setSelectedKey("");
            this.getView().byId("ReqQty").setSelectedKey("");
            this.getView().byId("ReqQty").setSelectedKey("");
        },
      
        //검색
        onSearch: function () {
            const ReqNum = this.byId("ReqNum").getValue();
            const ReqGood = this.byId("ReqGood").getValue();
            const ReqQty = this.byId("ReqQty").getValue();
            const Price = this.byId("price").getValue();
            const TotalPrice = this.byId("TotalPrice").getValue();
            const ReqStatus = this.byId("ReqStatus").getSelectedKey();
            const StartDate = this.byId("StartDate").getValue();
            const EndDate = this.byId("EndDate").getValue();
        
            const aFilter = [];
        
            // 날짜 유효성 검사
            if (StartDate && EndDate) {
                if (new Date(EndDate) < new Date(StartDate)) {
                    sap.m.MessageToast.show("종료일자는 시작일자보다 뒤에 와야 합니다.");
                    return;
                }
            }
        
            if (ReqNum) {
                aFilter.push(new Filter("request_number", FilterOperator.EQ, parseInt(ReqNum, 10)));
            }
        
            if (ReqGood) {
                aFilter.push(new Filter("request_product", FilterOperator.Contains, ReqGood));
            }
        
            if (ReqQty) {
                aFilter.push(new Filter("request_quantity", FilterOperator.EQ, parseInt(ReqQty, 10)));
            }
        
            if (Price) {
                aFilter.push(new Filter("request_estimated_price", FilterOperator.EQ, parseInt(Price, 10)));
            }
        
            if (TotalPrice) {
                aFilter.push(new Filter("request_total_price", FilterOperator.EQ, parseInt(TotalPrice, 10)));
            }
        
            // 날짜 필드 - ISO 8601 형식으로 (OData V4 표준)
            if (StartDate && EndDate) {
                const startOfDay = new Date(StartDate + "T00:00:00").toISOString();
                const endOfDay = new Date(EndDate + "T23:59:59").toISOString();
                aFilter.push(new Filter("request_date", FilterOperator.BT, startOfDay, endOfDay));
            } else if (StartDate) {
                const startOfDay = new Date(StartDate + "T00:00:00").toISOString();
                aFilter.push(new Filter("request_date", FilterOperator.GE, startOfDay));
            } else if (EndDate) {
                const endOfDay = new Date(EndDate + "T23:59:59").toISOString();
                aFilter.push(new Filter("request_date", FilterOperator.LE, endOfDay));
            }
        
            if (ReqStatus) {
                aFilter.push(new Filter("request_state", FilterOperator.Contains, ReqStatus));
            }
        
            // 테이블의 rows 또는 items에 필터 적용
            const oTableBinding = this.byId("RequestTable").getBinding("rows"); // 또는 "items"
            oTableBinding.filter(aFilter);
        } ,

        
        onSort: function () {
            if (!this.byId("SortDialog")) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "project1.view.fragment.SortDialog",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    oDialog.open("filter");
                }.bind(this));
            } else {
                this.byId("SortDialog").open("filter");
            }
            this.onSearch();
        },
        onConfirmSortDialog: function (oEvent) {
            let mParams = oEvent.getParameters();
            let sPath = mParams.sortItem.getKey();
            let bDescending = mParams.sortDescending;
            let aSorters = [];
            aSorters.push(new Sorter(sPath, bDescending));
            let oBinding = this.byId("RequestTable").getBinding("rows");
            oBinding.sort(aSorters);

        },
        onCreateOrder: function () {
            this.getOwnerComponent().getRouter().navTo("CreateOrder");
        },
        onShowRejectReason: function (oEvent) {
            const oSource = oEvent.getSource();  
            const oRow = oSource.getParent();    
            const rowIndex = oRow.getIndex();    
        
           
            const oTable = this.byId("RequestTable");
            const oContext = oTable.getContextByIndex(rowIndex); 
        
            if (!oContext) {
                console.error("Context is undefined for row: " + rowIndex);
                return;
            }
        
            const RejectReason = oContext.getProperty("request_reject_reason"); 
            const oView = this.getView();
            if (!this.nameDialog) {
                this.nameDialog = sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "project1.view.fragment.ShowRejectDialog",
                    controller: this
                }).then(function (oDialog) {
                    
                    oView.addDependent(oDialog);
        
                   
                    oDialog.setModel(new sap.ui.model.json.JSONModel({ rejectReason: RejectReason }), "dialogModel");
        
                    
                    oDialog.open();
                    return oDialog;
                });
            } else {
                this.nameDialog.open();  
            }
        }
        ,
        onCancelRejectReason: function () {
            this.byId("ShowRejectDialog").destroy();
            this.nameDialog = null;
        },

        //상세페이지 이동 
        onNavToDetail: function (oEvent) {
            const oContext = oEvent.getParameter("row").getBindingContext("RequestModel");
            const oData = oContext.getObject();
        
            const SelectedNum = oData.request_number;
        
            this.getOwnerComponent().getRouter().navTo("OrderDetail", { num: SelectedNum });
        },

        //선택 행 삭제
        onDeleteOrder: async function () {
           const aSelectedIndicies = this.byId("RequestTable").getSelectedIndices();

            if(aSelectedIndicies === 0){
                sap.m.MessageToast.show("삭제할 항목을 선택해주세요.");
                return;
            }

            MessageBox.confirm("선택한 항목을 삭제하시겠습니까?",{
                title: "삭제 확인",
                actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                onClose: async (oAction) => {
                    if(oAction === sap.m.MessageBox.Action.YES){
                        const aContexts = this.byId("RequestTable").getBinding("rows").getContexts();
                        aSelectedIndicies.forEach((idx) =>{
                         const oContext = aContexts[idx];
                         if(oContext){
                             oContext.delete();
                         }
                        })
                        
                        try {
                            await Promise.all(aDeletePromises);
                            sap.m.MessageBox.show("선택된 항목이 삭제되었습니다.");
                            this.getOwnerComponent().getModel("RequestModel").refresh(true);
                        } catch (err) {
                            console.error("삭제 처리 중 오류:", err);
                        }
                    }
                    
                }
            })
        },       
        
        onQuickDateRangeChange: function (oEvent) {
            const key = oEvent.getSource().getSelectedKey();
            const oTable = this.byId("RequestTable").getBinding("rows");
        
            const today = new Date();
            let fromDate = null;
        
            if (key === "week") {
                fromDate = new Date(today);
                fromDate.setDate(today.getDate() - 7);
            } else if (key === "month") {
                fromDate = new Date(today);
                fromDate.setMonth(today.getMonth() - 1);
            }
        
            if (fromDate) {
                // 날짜 목록을 생성 (예: ["2025-06-15", "2025-06-16"])
                const dates = [];
                const cur = new Date(fromDate);
                while (cur <= today) {
                    const y = cur.getFullYear();
                    const m = (cur.getMonth() + 1).toString().padStart(2, '0');
                    const d = cur.getDate().toString().padStart(2, '0');
                    dates.push(`${y}-${m}-${d}`);
                    cur.setDate(cur.getDate() + 1);
                }
        
                // 각 날짜 문자열을 포함하는 필터 조건 생성
                const aFilters = dates.map(dateStr =>
                    new sap.ui.model.Filter("request_date", sap.ui.model.FilterOperator.Contains, dateStr)
                );
        
                const oFilter = new sap.ui.model.Filter({
                    filters: aFilters,
                    and: false  // OR 조건으로 연결
                });
        
                oTable.filter(oFilter);
            } else {
                // 전체 보기: 필터 해제
                oTable.filter([]);
            }

            const totalDataLength = oTable.getLength();
            // 제목 업데이트
            const title = this.byId("tableName");
            title.setText(`물품 요청 목록(${totalDataLength})`);

        },
        onCellClick: function (oEvent) {

            const iRowIndex = oEvent.getParameter("rowIndex");
            const oTable = this.byId("RequestTable");

            const oContext = oTable.getContextByIndex(iRowIndex);
            if (!oContext) {
                console.warn(" 컨텍스트 없음 – 아직 선택 전 상태");
                return;
            }
        
            const oData = oContext.getObject();
            if (!oData || !oData.request_number) {
                console.warn(" 유효하지 않은 데이터");
                return;
            }
        
            this.getOwnerComponent().getRouter().navTo("OrderDetail", {
                num: oData.request_number
            });
        },
        Practice: function(){
            this.getOwnerComponent().getRouter().navTo("Create");
        },
        Practice2: function(){
            this.getOwnerComponent().getRouter().navTo("Detail");
        },
        Practice3: function(){
            this.getOwnerComponent().getRouter().navTo("Practice");
        }
        
        
        
        



    });
});