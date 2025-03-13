/*
  Google Apps Script backend for 桃聯區會考高中錄取分數
  
  Endpoints:
  • GET ?action=fetchSchools 
      Returns school data (dummy data here; replace with real data source as needed)
  • GET ?action=verify&code=... 
      Verifies an invite code (valid code is "ABC123")
  • POST 
      Records complete usage log information. Expects a JSON payload.
  
  To deploy:
  1. Create a new Apps Script project.
  2. Replace the code in Code.gs with the code below.
  3. (Optional) Set up a Google Sheet and update the spreadsheet ID in the commented-out section if you wish to record logs.
  4. Publish the project as a Web App.
*/

function doGet(e) {
  var action = e.parameter.action;
  
  if (action === "fetchSchools") {
    return fetchSchoolData();
  } else if (action === "verify") {
    return verifyInviteCode(e);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ error: "Invalid action." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    Logger.log("Received usage log: " + JSON.stringify(data));
    
    // Uncomment and update the following lines to write usage logs to a Google Sheet
    // var ss = SpreadsheetApp.openById("YOUR_SPREADSHEET_ID");
    // var sheet = ss.getSheetByName("Usage");
    // sheet.appendRow([
    //   data.timestamp,
    //   data.eventType,
    //   JSON.stringify(data.details),
    //   data.url,
    //   data.userAgent
    // ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Usage log recorded." }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Error processing POST: " + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function fetchSchoolData() {
  // Dummy data; replace with actual data retrieval logic if needed.
  var data = {
    visibleSchools: [
      { name: "桃園高中", department: "文科", score: 85 },
      { name: "中壢高中", department: "理科", score: 90 }
    ],
    hiddenSchools: [
      { name: "內壢高中", department: "綜合", score: 88 }
    ]
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function verifyInviteCode(e) {
  // Expected parameter: code
  var code = e.parameter.code || "";
  // For demonstration, a valid invite code is "ABC123"
  var valid = (code === "ABC123");
  return ContentService
    .createTextOutput(JSON.stringify({ valid: valid }))
    .setMimeType(ContentService.MimeType.JSON);
}