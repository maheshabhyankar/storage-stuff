const CLIENT_ID = '934930072330-snn2dsljsjq65ecn7dc21nu7onk5sqbt.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDLaHjkcrJ3CUuNeNIgW-ODf1OoErbWj10';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('signInButton').style.display = 'block';
    }
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        document.getElementById('signInButton').innerText = 'Refresh';
        document.getElementById('inventoryForm').style.display = 'block';
        await listMajors();
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

async function listMajors() {
    let response;
    try {
        response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '1NrCeFZ_dfgpKbp7QoijdI2FJ6VP0k7A9N34IxfAvh1w',
            range: 'Sheet1!A1:C',
        });
    } catch (err) {
        document.getElementById('content').innerText = err.message;
        return;
    }
    const range = response.result;
    if (!range || !range.values || range.values.length == 0) {
        document.getElementById('content').innerText = 'No values found.';
        return;
    }
    // Flatten to string to display
    const output = range.values.reduce(
        (str, row) => `${str}${row[0]}, ${row[1]}, ${row[2]}\n`,
        'Item, Location, Date:\n');
    document.getElementById('content').innerText = output;
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const item = document.getElementById('item').value;
    const location = document.getElementById('location').value;
    const date = document.getElementById('date').value;

    try {
        const response = await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: '1NrCeFZ_dfgpKbp7QoijdI2FJ6VP0k7A9N34IxfAvh1w',
            range: 'Sheet1!A1',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[item, location, date]]
            }
        });
        console.log('Item added:', response);
        document.getElementById('inventoryForm').reset();
        await listMajors(); // Refresh the displayed data
    } catch (err) {
        console.error('Error adding item:', err);
    }
}

document.getElementById('signInButton').onclick = handleAuthClick;
document.getElementById('inventoryForm').onsubmit = handleFormSubmit;

// Load the Google API client and auth2 library
function loadGapiAndGis() {
    gapi.load('client', gapiLoaded);
    gisLoaded();
}

// Call this function when the page loads
window.onload = loadGapiAndGis;