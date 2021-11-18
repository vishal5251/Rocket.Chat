// @ts-ignore
import { MatrixBridgedRoom } from '../../../models';
import { IRoom } from '../../../../definition/IRoom';
import { bridge } from '../bridge';

export async function afterAddedToRoom(_: any, room: IRoom): Promise<void> {
	// const intent = bridge.getIntent();
	//
	// // Retrieve the matrix room
	// const roomMatrixId = MatrixBridgedRoom.getMatrixId(room._id);
	//
	// // Add the user
	// await intent.invite(roomMatrixId, '@rocketchat_userb:b.rc.allskar.com');
}
