import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus
} from '@nestjs/common';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
    catch( exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        let status = exception instanceof HttpException 
            ? exception.getStatus() 
            : HttpStatus.INTERNAL_SERVER_ERROR;

        let message = exception instanceof HttpException 
            ? exception.getResponse() 
            : 'Internal server error';

        // Se o message do HttpException for um objeto, transforma em string legível
        if (typeof message === 'object' && message !== null) {
            message = (message as any).message || JSON.stringify(message);
        }

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            error: message
        });
    }
}