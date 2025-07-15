// Download the helper library from https://www.twilio.com/docs/node/install
const twilio = require("twilio"); // Or, for ESM: import twilio from "twilio";

// Find your Account SID and Auth Token at twilio.com/console
// and set the environment variables. See http://twil.io/secure
// TODO: fill credentials

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

async function sendOtp(toNumber) {
  if (toNumber.startsWith("00")) {
    toNumber = toNumber.substring(2);
    toNumber = "+" + toNumber;
  }
  client.verify.v2
    .services("VA885085e3e1135d9b6e83319559ef7f4a")
    .verifications.create({ to: toNumber, channel: "sms" })
    .then((verification) => console.log(verification.sid))
    .catch((err) => console.log(err));
}

async function verifyOtp(toNumber, otp) {
  if (toNumber.startsWith("00")) {
    toNumber = toNumber.substring(2);
    toNumber = "+" + toNumber;
  }
  return await client.verify.v2
    .services("VA885085e3e1135d9b6e83319559ef7f4a")
    .verificationChecks.create({ to: toNumber, code: otp })
    .then((verification_check) => {
      console.log(verification_check.status);
      return verification_check.status == "approved";
    });
}
module.exports = { sendOtp, verifyOtp };
