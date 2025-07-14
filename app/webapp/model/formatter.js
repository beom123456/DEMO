sap.ui.define([],function(){
    "use strict";
    return{
        statusText: function(sStatus){
            switch(sStatus){
                case "A":
                    return "승인";
                case "B":
                    return "처리대기";
                case "C":
                    return "반려";
                default:
                    return sStatus;
            }
        },
        statusState: function(sStatus){
            switch(sStatus){
                case "A":
                    return "Success";
                case "C":
                    return "Error";
                default:
                    return "None"
            }
        },
        formatCurrency: function (value) {
            if (!value) return "";
        
            return value.toLocaleString("ko-KR") +"원";
        },
        formatQuantity: function(value){
            if(!value) return "";
            
            return value.toLocaleString("ko-KR") + "개";
        }
    }
});