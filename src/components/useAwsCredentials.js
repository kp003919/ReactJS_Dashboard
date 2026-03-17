// src/hooks/useAwsCredentials.js
import { useEffect, useState } from "react";
import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand
} from "@aws-sdk/client-cognito-identity";

export function useAwsCredentials(identityPoolId) {
  const [creds, setCreds] = useState(null);

  useEffect(() => {
    async function fetchCreds() {
      try {
        const client = new CognitoIdentityClient({ region: "eu-west-2" });

        const idResp = await client.send(
          new GetIdCommand({ IdentityPoolId: identityPoolId })
        );

        const credResp = await client.send(
          new GetCredentialsForIdentityCommand({
            IdentityId: idResp.IdentityId
          })
        );

        setCreds(credResp.Credentials);
      } catch (err) {
        console.error("Failed to load AWS credentials:", err);
      }
    }

    fetchCreds();
  }, [identityPoolId]);

  return creds;
}
