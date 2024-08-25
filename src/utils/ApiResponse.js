class ApiResponse{
    constructor(statusCode,data,messsage="Succes"){
        this.statusCode=statusCode
        this.data=datathis.messsage=messsage
        this.success= statusCode<400 
    }
}