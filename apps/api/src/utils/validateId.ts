import mongoose from 'mongoose';
import { AppError } from './AppError';

/**
 * Validates a string is a valid MongoDB ObjectId.
 * Throws AppError(400) if invalid.
 */
export function validateObjectId(id: string, fieldName: string = 'ID'): void {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(`Invalid ${fieldName}: ${id}`, 400);
    }
}
