// @ts-ignore
import { MatrixBridgedRoom, MatrixBridgedUser } from '../../../models';
import { bridge } from '../bridge';
import { IMessage } from '../../../../definition/IMessage';
import { IRoom } from '../../../../definition/IRoom';

export async function afterSaveMessage(message: IMessage, room: IRoom): Promise<IMessage> {
	// Retrieve the matrix user
	const userMatrixId = MatrixBridgedUser.getMatrixId(message.u._id);

	// Retrieve the matrix room
	const roomMatrixId = MatrixBridgedRoom.getMatrixId(room._id);

	console.log(message, userMatrixId);
	console.log(roomMatrixId);

	const intent = bridge.getIntent(userMatrixId);
	await intent.sendText(roomMatrixId, message.msg || '...not-supported...');

	return message;
}
