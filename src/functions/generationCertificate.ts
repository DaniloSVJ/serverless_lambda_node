import { APIGatewayProxyHandler } from "aws-lambda";
import { document } from "../utils/dynamodbClient"; 
import {compile} from "handlebars"
import {join} from "path"
import { readFileSync } from "fs";
import  dayjs from "dayjs";
import chromium from "chrome-aws-lambda"
import puppeteer from "puppeteer"
import {S3} from 'aws-sdk'


interface ICreateCerficate{
    id:string,
    name:string,
    grade:string
}

interface ITemplate{
    id:string,
    name:string,
    grade:string,
    medal:string,
    date:string,
}

const compileFile = async (data:ITemplate)=>{
    const filePath = join(process.cwd(),"src","templates","certificate.hbs")

    const html = readFileSync(filePath,"utf-8")

    return compile(html)(data)

}
export const handler:APIGatewayProxyHandler = async (event)=>{
    
    try {
        const {id,name,grade} = JSON.parse(event.body) as ICreateCerficate
        const response = await document.query({
            TableName:"users-certificate",
            KeyConditionExpression: "id = :idValue",
            ExpressionAttributeValues: {
                ":idValue": id
            }
        }).promise()
    
        const userAlreadyExists = response.Items[0]
    
        if(!userAlreadyExists){
            await document.put({
                TableName:"users-certificate",
                Item:{
                    id,
                    name,
                    grade,
                    create_at: new Date().getTime()
                }
            }).promise();
        }
    const medalPath = join(process.cwd(),"src","templates","selo.png")
    const medal = readFileSync(medalPath,"base64")
    const data: ITemplate ={
        name,
        id,
        grade,
        date: dayjs().format("DD/MM/YYYY"),
        medal
    }
    const content = await compileFile(data)
    //const executablePath =  await chromium.executablePath(join(process.cwd(), "src","chromium"))

    const browser = await puppeteer.launch({
        args: [...chromium.args, 
            '--user-data-dir=/tmp',  
            '--disable-gpu',
            '-disable-software-rasterizer' 
            ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await  chromium.executablePath,
        headless: chromium.headless,
    })
    const page = await browser.newPage()
    await page.setContent(content)
    const pdf = await page.pdf({
        format: 'a4',
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true,
        path: process.env.IS_OFFLINE ? "./certificate.pdf" : null

    })
  
    const s3 = new S3();
    // await s3 
    //     .createBucket({
    //         Bucket: "certificatenoded2"
    //     }).promise()
    await s3
        .putObject({
            Bucket: "certificatenoded2",
            Key: `${id}.pdf`,
           // ACL: "public-read",
            Body: pdf,
            ContentType:"application/pdf"
        }).promise()
    await browser.close()
    return{ 
        statusCode:201,
        body: JSON.stringify(response.Items[0])
    }


} catch (error) {
    console.error("Error launching Chromium:", error);
    return {
      statusCode: 500,
      body: 'Failed to launch Chromium',
    };
  }
}