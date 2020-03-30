var SheetHelper = {
    getActiveSheet: function () {
      return SpreadsheetApp.getActiveSheet();
    },
    getSheetByNameAndId: function (sheetsId, sheetsName) {
      var ss = SpreadsheetApp.openById(sheetsId);
      var sheets = ss.getSheets();
      return this.searchSheetByName(sheets, sheetsName);
    },
    searchSheetByName: function (sheets, sheetsName) {
        var sheet = sheets[0];
        for (var i = 0; i < sheets.length; i++) {
            if (sheets[i].getName() == sheetsName) {
                sheet = sheets[i];
                break;
            }
        }
        return sheet;
    },
    getKeyOnHead: function (head) {
      if (!!!head) return "";
      var start = head.indexOf("(");
      if (start != -1) {
        head = head.substring(start + 1);
        var end = head.indexOf(")");
        if (end != -1) {
          head = head.substring(0, end);
        }
      }
      return head.replace("\n", "");
    }
};