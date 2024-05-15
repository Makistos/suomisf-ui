export const replyMessage = (msg: any) => {
    let errMsg = JSON.parse(msg.response).data["msg"];
    if (errMsg === undefined) {
        errMsg = JSON.parse(msg.response).data;
    }
    console.log(errMsg);
    return errMsg;
}

