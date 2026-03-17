import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { AwsIotMqttConnectionConfigBuilder, mqtt } from "aws-iot-device-sdk-v2";

const REGION = "eu-west-2";
const IDENTITY_POOL_ID = "eu-west-2:62e6c7b7-bd74-43bc-8b55-007a8a972d22";
const IOT_ENDPOINT = "a3cv66lhwjj8z4-ats.iot.eu-west-2.amazonaws.com";

export async function createRtlsMqttClient() {
  const credentialsProvider = fromCognitoIdentityPool({
    clientConfig: { region: REGION },
    identityPoolId: IDENTITY_POOL_ID,
  });

  const builder = AwsIotMqttConnectionConfigBuilder.new_with_websockets({
    region: REGION,
    credentials_provider: credentialsProvider,
  });

  builder.with_clean_session(true);
  builder.with_client_id("dashboard-" + Math.floor(Math.random() * 100000));
  builder.with_endpoint(IOT_ENDPOINT);

  const config = builder.build();

  const client = new mqtt.MqttClient();
  const connection = client.new_connection(config);

  return connection;
}
