/*
  Google Apps Script backend for school admission data.

  Spreadsheet columns can include:
  name, department, score, isVisible,
  國文, 英語, 數學, 社會, 自然, 寫作測驗
*/

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();

  if (data.length === 0) {
    return jsonResponse({
      visibleSchools: [],
      hiddenSchools: [],
      subjectRequirementNote: getSubjectRequirementNote()
    });
  }

  var headers = data[0];
  var jsonData = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var record = {};

    for (var j = 0; j < headers.length; j++) {
      record[headers[j]] = row[j];
    }

    record.subjectRequirements = buildSubjectRequirements(record);
    record.ownership = getSchoolOwnership(record);
    jsonData.push(record);
  }

  var visibleSchools = jsonData.filter(function(school) {
    return isVisibleValue(school.isVisible);
  });

  var hiddenSchools = jsonData.filter(function(school) {
    return !isVisibleValue(school.isVisible);
  });

  return jsonResponse({
    visibleSchools: visibleSchools,
    hiddenSchools: hiddenSchools,
    subjectRequirementNote: getSubjectRequirementNote()
  });
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    Logger.log("Received usage log: " + JSON.stringify(data));

    return jsonResponse({
      status: "success",
      message: "Usage log recorded."
    });
  } catch (error) {
    Logger.log("Error processing POST: " + error.toString());
    return jsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

function buildSubjectRequirements(record) {
  var subjects = ["國文", "英語", "數學", "社會", "自然", "寫作測驗"];
  var requirements = {};

  subjects.forEach(function(subject) {
    if (record[subject] !== "" && record[subject] != null) {
      requirements[subject] = record[subject];
    }
  });

  return requirements;
}

function getSchoolOwnership(record) {
  var rawValue = record["公私立"] || record["公立私立"] || record["學校類型"] ||
    record.schoolType || record.ownership || record.type || record.name || "";
  var value = String(rawValue).toLowerCase();

  if (value.indexOf("私") !== -1) {
    return "private";
  }
  if (
    value.indexOf("公") !== -1 ||
    value.indexOf("國立") !== -1 ||
    value.indexOf("市立") !== -1 ||
    value.indexOf("縣立") !== -1
  ) {
    return "public";
  }
  return "";
}

function isVisibleValue(value) {
  return value === true || value === "TRUE" || value === "true" || value === 1 || value === "1";
}

function getSubjectRequirementNote() {
  return "如果積分、積點都超過該校錄取要求，就不需再看單科標示；單科標準主要供積分或積點接近門檻時參考。";
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
