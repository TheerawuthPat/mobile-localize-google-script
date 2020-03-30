var appName = "Localize WE Connect";

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createAddonMenu()
  .addItem("Android","showDownloadMenuAndroid")
  .addItem("iOS","showDownloadMenuIos")
  .addToUi()
};
function showDownloadMenuIos(){
  showDownloadMenu("ios")
}
function showDownloadMenuAndroid(){
  showDownloadMenu("android")
}
function showDownloadMenu(platform){
  var ui = UiApp.createApplication().setTitle('Download')
  var url = ScriptApp.getService().getUrl()
  var p = ui.createVerticalPanel()
  var sheet = SpreadsheetApp.getActiveSheet()
  var data = sheet.getDataRange().getValues()
  var languages= getAvaiableLanguages(data)
  for(var lang in languages){
    var langPara = "lang="+lang
    var platformPara = "platform="+platform
    var langUrl = url + "?"+langPara+"&"+platformPara
    p.add(ui.createAnchor(lang, langUrl));
    ui.add(p)
  }
  SpreadsheetApp.getActive().show(ui)
}

function getAvaiableLanguages(data){
  var languages = {}
  var i = 2;
  while (data[0][i] != null && data[0][i].length > 0) {
    var results = data[0][i].match(/\((\w\w)\)/g);
    if (results!=null && results.length > 0) {
      Logger.log(results[0])
      var language = results[0].replace("(", "").replace(")", "");
      languages[language] = i
    }
    i++;
  }
  
  Logger.log("languages: " +languages)
  return languages;
}

function getResourceEnumIos(column){
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var content = "import Foundation\n\npublic enum TranslateType: String {";
  
  for (var i = 1; i < data.length; i++) {
    
    if (data[i][1].length == 0) {
      continue;
    }
    
    var screenName = data[i][0].toString().toLowerCase().replace(/\s/g, '_');
    var key = data[i][1].toString().toLowerCase().replace(/\s/g, '_');
    var finalKey = screenName + "_" + key;
    
    content += '\n\tcase ' + finalKey;
  }
  
  content += "\n}";
  
  return content
}

function getResourceIos(column){
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var content = "\n";
  
  for (var i = 1; i < data.length; i++) {
    
    if (data[i][1].length == 0) {
      continue;
    }
    
    var screenName = data[i][0].toString().toLowerCase().replace(/\s/g, '_');
    var key = data[i][1].toString().toLowerCase().replace(/\s/g, '_');
    var finalKey = screenName + "_" + key;
    var value = data[i][column];
    value = value.replace("/%s/g", "%@");
    value = value.replace(/"/g, '\\"');
    value = value.replace(/(?:\r\n|\r|\n)/g, '\\n');
    
    content += '\n"' + finalKey + '" = "' + value + '";';
  }
  
  Logger.log(content)
  return content
}

function getResourceAndroid(column){
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var content = '<?xml version="1.0" encoding="utf-8"?>\n';
  content += "<resources>";
  for (var i = 1; i < data.length; i++) {
    var formatted = "";
    if (data[i][2].indexOf("%s") > -1 || data[i][2].indexOf("%d") > -1) {
        formatted = ' formatted="false"';
    }
    if (data[i][2].search(new RegExp("{([0-9])}")) > -1) {
        formatted = ' formatted="true"';
    }    

    var escapedDoubleQuote = new RegExp('["]', 'g');
    var escapedSingleQuote = new RegExp("[']", 'g');
    var escapedAmp = new RegExp("[&]", 'g');
    var escapedPercent = new RegExp("[%]", 'g');
    var escapedLessThan = new RegExp("[<]", 'g');
    var escapedMoreThan = new RegExp("[>]", 'g');
    var excapedStringAutobinding = new RegExp("{([0-9])}", 'g');
    var escapedContent = data[i][column]
                        .replace(escapedDoubleQuote, '\\"')
                        .replace(escapedSingleQuote, "\\'")
                        .replace(escapedAmp, "&amp;")
                        .replace(new RegExp("\\.\\.\\.", 'g'), "&#8230;")
                        .replace(escapedPercent,"%%")
                        .replace(escapedLessThan, "&lt;")
                        .replace(escapedMoreThan, "&gt;")
                        .replace(excapedStringAutobinding,"%$1$s");
    var screen = data[i][0].replace(new RegExp("\\s{1,}",'g'), "_")
    var key = data[i][1].replace(new RegExp("\\s{1,}",'g'), "_")
    key = screen+"_"+key
    key = key.toLowerCase()
    content += '\n\t<string name="' + key + '"' + formatted + '>' + escapedContent + '</string>';
  }
  content += "\n\n</resources>";
  Logger.log(content)
  return content
}

function updateResource() {
  
  // Folders
  var appFolder = createOrGetFolder(appName);
  var androidFolder = createOrGetFolder("Android", appFolder);
  var iOSFolder = createOrGetFolder("iOS", appFolder);
  
  // Data
  var sheet = SpreadsheetApp.getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  var i = 2;
  while (data[1][i] != null && data[1][i].length > 0) {
  
    var results = data[1][i].match(/\((\w\w)\)/g);
    if (results.length > 0) {
      var language = results[0].replace("(", "").replace(")", "");
      createAndroidResources(language, data, androidFolder, i);
      createIOSResources(language, data, iOSFolder, i);
    }
    
    i++;
  }
  
}
// Create a localizable file for iOS
// language: Current language
// data:     Spreadsheet data array
// folder:   Folder where create the file
// column:   Index of the column
function createIOSResources(language, data, folder, column) {
    
  var content = "// App";
  content += "\n";
  content += '"APP_NAME" = "' + appName + '";';
  
  for (var i = 3; i < data.length; i++) {
    
    if (data[i][1].length == 0) {
      continue;
    }
    
    if (data[i][0].length > 0) {
      content += "\n\n// " + data[i][0] + "";
    }

    var value = data[i][column];
    value = value.replace("/%s/g", "%@");
    value = value.replace(/"/g, '\\"');
    value = value.replace(/(?:\r\n|\r|\n)/g, '\\n');
    
    content += '\n"' + data[i][1] + '" = "' + value + '";';
  }
  
  var fileName = "Localizable_" + language.toUpperCase() + ".strings";
  var file = createOrGetFile(fileName, folder);
  file.setContent(content);
}



////////////
// HELPER //
////////////

// Check folder
function createOrGetFolder(name, folder) {
  var folders;
  if (folder == undefined) {
    folders = DriveApp.getFoldersByName(name)
  } else {
    folders = folder.getFoldersByName(name)
  }
  
  var mainFolder;
  if (folders.hasNext()) {
    mainFolder = folders.next();
  } else {
     if (folder == undefined) {
       mainFolder = DriveApp.createFolder(name);
     } else {
       mainFolder = folder.createFolder(name);
     }
  } 
  
  return mainFolder;
}


// Check file
function createOrGetFile(name, folder) {
  var files;
  if (folder == undefined) {
    files = DriveApp.getFilesByName(name)
  } else {
    files = folder.getFilesByName(name)
  }
  
  var file;
  if (files.hasNext()) {
    file = files.next();
  } else {
     if (folder == undefined) {
       file = DriveApp.createFile(name, "");
     } else {
       file = folder.createFile(name, "");
     }
  } 
  return file;
}

function createOrGetFileFromBlob(blob, folder) {
  var files;
  if (folder == undefined) {
    files = DriveApp.getFilesByName(blob.getName())
  } else {
    files = folder.getFilesByName(blob.getName())
  }
  
  var file;
  if (files.hasNext()) {
    file = files.next();
  } else {
     if (folder == undefined) {
       DriveApp.removeFile(file)
       file = DriveApp.createFile(blob);
     } else {
       folder.removeFile(file)
       file = folder.createFile(blob);
     }
  } 
  return file;
}

function downloadZip() {
  var appFolder = createOrGetFolder(appName);
  var zipped = Utilities.zip(getBlobs(appFolder,""),"WEConnectLocalize.zip");
  var zipFolder =createOrGetFolder(appName+"Zip")
  var zipFile = createOrGetFileFromBlob(zipped,zipFolder)
  zipFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.NONE); 
  var fileID = zipFile.getId();
  var fileName = zipFile.getName();
  var ui = UiApp.createApplication().setTitle('Download');
  var url = ScriptApp.getService().getUrl()
  var p = ui.createVerticalPanel();
  ui.add(p);
  p.add(ui.createAnchor('or use this link ',zipFile.getUrl()));
  p.add(ui.createAnchor('Test download', url));
  SpreadsheetApp.getActive().show(ui);
}

function getBlobs(rootFolder, path) {
  var blobs = [];
  var names = {};
  var files = rootFolder.getFiles();
  while (files.hasNext()) {
    var file = files.next().getBlob();
    var n = file.getName();
    while(names[n]) { n = '_' + n }
    names[n] = true;
    blobs.push(file.setName(path+n));
  }
  names = {};
  var folders = rootFolder.getFolders();
  while (folders.hasNext()) {
    var folder = folders.next();
    var n = folder.getName();
    while(names[n]) { n = '_' + n }
    names[n] = true;
    var fPath = path+n+'/';
    blobs.push(Utilities.newBlob([]).setName(fPath)); //comment/uncomment this line to skip/include empty folders
    blobs = blobs.concat(getBlobs(folder, fPath));
  }
  return blobs;
}

function doGet(e){
  var content = ""
  var platform = e.parameter.platform
  var lang = e.parameter.lang
  if (lang == null) {
    content = getResourceEnumIos(column)
    var fileName = "Translate.swift";
  }else{
    var sheet = SheetHelper.getSheetByNameAndId("1iXu2MGJoEKw6iUm3Hj8FP68H6yOKn4_3GgfsA3pXv2o", "Mobile Localize");
    var data = sheet.getDataRange().getValues()
    var languages= getAvaiableLanguages(data)
    var column = languages[lang]
    Logger.log(languages)
    Logger.log(column)
    var fileName = "string.xml"
    if(platform == "android"){
      content = getResourceAndroid(column)
      fileName = "string.xml"
    }else{
      content = getResourceIos(column)
      var fileName = "Localizable_" + lang.toUpperCase() + ".strings";
    }
  }
  
  
  return ContentService.createTextOutput(content).downloadAsFile(fileName);
}