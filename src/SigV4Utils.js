
import CryptoJS from "crypto-js";

// SigV4 signing utility (same as before)
// Generates a signed WebSocket URL for AWS IoT using SigV4 signing
//  endpoint: AWS IoT endpoint URL
//  region: AWS region
//  credentials: AWS credentials object containing accessKeyId, secretAccessKey, and optional sessionToken
//  returns: Signed WebSocket URL for MQTT connection 
// Example usage:
//  const url = getSignedUrl(endpoint, region, credentials);  
// const client = mqtt.connect(url, { clientId });
// Example usage:
//  const url = getSignedUrl(endpoint, region, credentials);

export function getSignedUrl(endpoint, region, credentials) {
  const time = new Date();
  const dateStamp = time.toISOString().slice(0, 10).replace(/-/g, "");
  const amzdate = time.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const service = "iotdevicegateway";
  const algorithm = "AWS4-HMAC-SHA256";
  const method = "GET";
  const canonicalUri = "/mqtt";

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const canonicalQuerystring =
    "X-Amz-Algorithm=" + algorithm +
    "&X-Amz-Credential=" + encodeURIComponent(credentials.accessKeyId + "/" + credentialScope) +
    "&X-Amz-Date=" + amzdate +
    "&X-Amz-SignedHeaders=host";

  const canonicalHeaders = "host:" + endpoint + "\n";
  const signedHeaders = "host";
  const payloadHash = CryptoJS.SHA256("").toString(CryptoJS.enc.Hex);

  const canonicalRequest =
    method + "\n" +
    canonicalUri + "\n" +
    canonicalQuerystring + "\n" +
    canonicalHeaders + "\n" +
    signedHeaders + "\n" +
    payloadHash;

  const stringToSign =
    algorithm + "\n" +
    amzdate + "\n" +
    credentialScope + "\n" +
    CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex);

  function sign(key, msg) {
    return CryptoJS.HmacSHA256(msg, key);
  }

  const kDate = sign("AWS4" + credentials.secretAccessKey, dateStamp);
  const kRegion = sign(kDate, region);
  const kService = sign(kRegion, service);
  const kSigning = sign(kService, "aws4_request");

  const signature = CryptoJS.HmacSHA256(stringToSign, kSigning).toString(CryptoJS.enc.Hex);

  const finalQuerystring = canonicalQuerystring + "&X-Amz-Signature=" + signature;

  let url = "wss://" + endpoint + canonicalUri + "?" + finalQuerystring;

  if (credentials.sessionToken) {
    url += "&X-Amz-Security-Token=" + encodeURIComponent(credentials.sessionToken);
  }

  return url;
}
