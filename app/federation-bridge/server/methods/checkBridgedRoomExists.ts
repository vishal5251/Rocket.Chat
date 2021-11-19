import { MatrixBridgedRoom } from '../../../models';

export const checkBridgedRoomExists = async (matrixRoomId: string): Promise<boolean> => {
	const existingRoomId = MatrixBridgedRoom.getId(matrixRoomId);
	return !!existingRoomId;
};
