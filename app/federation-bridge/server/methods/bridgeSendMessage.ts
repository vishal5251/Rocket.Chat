import { MatrixBridgedRoom, MatrixBridgedUser } from '../../../models/server';
import { bridge } from '../bridge';
import { IMessage } from '../../../../definition/IMessage';

export const bridgeSendMessage = async (message: IMessage): Promise<IMessage> => {
	// Retrieve the matrix user
	const userMatrixId = MatrixBridgedUser.getMatrixId(message.u._id);

	// Retrieve the matrix room
	const roomMatrixId = MatrixBridgedRoom.getMatrixId(message.rid);

	if (!userMatrixId) {
		throw new Error(`Could not find user matrix id for ${ message.u._id }`);
	}

	if (!roomMatrixId) {
		throw new Error(`Could not find room matrix id for ${ message.rid }`);
	}

	const intent = bridge.getIntent(userMatrixId);
	await intent.sendText(roomMatrixId, message.msg || '...not-supported...');

	return message;
};
