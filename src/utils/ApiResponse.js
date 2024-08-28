class ApiResponse{
    constructor(statusCode,data,messsage="Succes"){
        this.statusCode=statusCode
        this.data=data 
        this.messsage=messsage
        this.success= statusCode<400 
    }
}

export {ApiResponse}