import {ApiClient} from "recombee-api-client";
import recombee from "recombee-api-client";

import { config } from "dotenv";
config();

const client = new ApiClient(
  'one-org-testaudio',
  'Sjb9WJ0nbEtiz9JJzX1K2kOhMhLDXzNjJtA7TVDIxPfwYFtPrgOg2xt0yJx31RHE',
  { region: 'eu-west' }
);

const request = recombee.requests;

async function test() {
  try {
    
    const safeId = "Guru_Randhawa_SIRRA_m4a";
    const req1 = new recombee.requests.SetItemValues(safeId, {}, { cascadeCreate: true });
    req1.timeout = 10000;
    await client.send(req1);
    console.log("Safe ID worked!");

    const badId = "Guru Randhawa - SIRRA ( Official Video ).m4a";
    const req2 = new recombee.requests.SetItemValues(badId, {}, { cascadeCreate: true })
    req2.timeout = 10000;
    await client.send(req2);
    console.log("Bad ID worked too!");
  } catch (e) {
    console.error("Failed:", e);
  }
}
test();
