const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
module.exports = app;

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initiateDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initiateDBAndServer();

const stateTableConversion = (anObject) => {
  return {
    stateId: anObject.state_id,
    stateName: anObject.state_name,
    population: anObject.population,
  };
};

const districtTableConversion = (anObject) => {
  return {
    districtId: anObject.district_id,
    districtName: anObject.district_name,
    stateId: anObject.state_id,
    cases: anObject.cases,
    cured: anObject.cured,
    active: anObject.active,
    deaths: anObject.deaths,
  };
};

//API_1
app.get("/states/", async (request, response) => {
  const sqlQuery = `
        SELECT *
        FROM state;`;

  const reqData = await db.all(sqlQuery);
  const reqDataFormat = reqData.map((eachObject) =>
    stateTableConversion(eachObject)
  );
  response.send(reqDataFormat);
});

//API_2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const sqlQuery = `
        SELECT *
        FROM state
        WHERE state_id = ${stateId};`;

  const reqData = await db.get(sqlQuery);
  const reqDataFormat = stateTableConversion(reqData);
  response.send(reqDataFormat);
});

//API_3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  console.log(districtName);

  const sqlQuery = `
        INSERT INTO district
            (district_name,state_id,cases,cured,active,deaths)
        VALUES (
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
            );`;

  const reqData = await db.run(sqlQuery);

  response.send("District Successfully Added");
});

//API_4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const sqlQuery = `
        SELECT *
        FROM district
        WHERE district_id = ${districtId};`;

  const reqData = await db.get(sqlQuery);
  const reqDataFormat = districtTableConversion(reqData);

  response.send(reqDataFormat);
});

//API_5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const sqlQuery = `
        DELETE
        FROM district
        WHERE district_id = ${districtId};`;

  const reqData = await db.run(sqlQuery);
  response.send("District Removed");
});

//API_6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const sqlQuery = `
        UPDATE district
        SET 
            district_name = '${districtName}',
            stateId = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE 
            district_id = ${districtId}; `;

  const reqData = await db.run(sqlQuery);
  response.send("District Details Updated");
});

//API_7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const sqlQuery = `
        SELECT 
            SUM(cases) AS totalCases,
            SUM(cured) AS totalCured,
            SUM(active) AS totalActive,
            SUM(deaths) AS totalDeaths
        FROM district 
        WHERE 
            state_id = ${stateId};`;

  const reqData = await db.get(sqlQuery);
  response.send(reqData);
});

//API_8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const sqlQuery = `
        SELECT state_name
        FROM state LEFT JOIN district
        WHERE district_id = ${districtId};`;

  const reqData = await db.get(sqlQuery);
  const reqDataFormat = stateTableConversion(reqData);
  response.send(reqDataFormat);
});
