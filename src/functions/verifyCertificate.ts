import { APIGatewayProxyHandler } from "aws-lambda";
import { document } from "../utils/dynamodbClient";

interface IUserCertificate {
    name: string;
    id:string;
    created_at: string;
    grade:string;

}

export const handler: APIGatewayProxyHandler = async (event) =>{
    const {id} = event.pathParameters

    const response = await document
        .query({
            TableName:"users-certificate",
            KeyConditionExpression: "id = :idValue",
            ExpressionAttributeValues: {
                ":idValue": id
            }
        }).promise()
    const userCertificate = response.Items[0] as IUserCertificate;

    if(userCertificate){
        return{
            statusCode:201,
            body: JSON.stringify({
                message: "Certificado válido",
                name: userCertificate.name,
                url: 'https://certificatenoded2.s3.amazonaws.com/e374ab24-74e1-11ee-b962-0242ac120002.pdf'
            })
        }
    }

    return{
        statusCode:400,
        body: JSON.stringify({
            message: "Certificado inválido",
        })
    }

}