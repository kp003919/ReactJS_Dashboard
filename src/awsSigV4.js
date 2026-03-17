import AWS from "aws-sdk";

export async function getSignedUrl(endpoint, region, identityPoolId) {
  AWS.config.region = region;
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId
  });

  await new Promise((resolve, reject) => {
    AWS.config.credentials.get(err => {
      if (err) reject(err);
      else resolve();
    });
  });

  const creds = AWS.config.credentials;

  const request = {
    host: endpoint,
    path: "/mqtt",
    service: "iotdevicegateway",
    region,
    method: "GET"
  };

  const signer = new AWS.Signers.V4(request, "iotdevicegateway");
  signer.addAuthorization(creds, AWS.util.date.getDate());

  const query = Object.entries(request.headers)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  return `wss://${endpoint}/mqtt?${query}`;
}
