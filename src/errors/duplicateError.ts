import { TGenericErrorResponse } from '../Types/error';

const duplicateError = (err: any): TGenericErrorResponse => {
    const match = err.message.match(/"([^"]*)"/);

    const extractedMessage = match && match[1];

    const errorSources = `${extractedMessage} is already exists`;

    const statusCode = 400;

    return {
        statusCode,
        message: 'Invalid ID',
        errorSources: [{
            path: '',
            message: errorSources,
        }],
    };
};

export default duplicateError;