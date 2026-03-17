// src/utils/signAwsIotUrl.js
import crypto from "crypto-js";

export function signAwsIotUrl({ endpoint, region, accessKeyId, secretAccessKey, sessionToken }) {
  const now = new Date();
  const amzdate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const datestamp = amzdate.substring(0, 8);

  const service = "iotdevicegateway";
  const algorithm = "AWS4-HMAC-SHA256";
  const method = "GET";
  const canonicalUri = "/mqtt";

  const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;

  const canonicalQuerystring =
    `X-Amz-Algorithm=${algorithm}` +
    `&X-Amz-Credential=${encodeURIComponent(accessKeyId + "/" + credentialScope)}` +
    `&X-Amz-Date=${amzdate}` +
    `&X-Amz-SignedHeaders=host`;

  const canonicalHeaders = `host:${endpoint}\n`;
  const signedHeaders = "host";
  const payloadHash = crypto.SHA256("").toString();

  const canonicalRequest =
    `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const stringToSign =
    `${algorithm}\n${amzdate}\n${credentialScope}\n${crypto.SHA256(canonicalRequest).toString()}`;

  function hmac(key, msg) {
    return crypto.HmacSHA256(msg, key);
  }

  const kDate = hmac("AWS4" + secretAccessKey, datestamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");

  const signature = crypto.HmacSHA256(stringToSign, kSigning).toString();

  let finalQuerystring = `${canonicalQuerystring}&X-Amz-Signature=${signature}`;

  if (sessionToken) {
    finalQuerystring += `&X-Amz-Security-Token=${encodeURIComponent(sessionToken)}`;
  }

  return `wss://${endpoint}/mqtt?${finalQuerystring}`;
}
