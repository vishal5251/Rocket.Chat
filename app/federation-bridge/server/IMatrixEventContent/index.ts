import { MatrixEventType } from '../definitions/MatrixEventType';
import { IMatrixEventContentCreateRoom } from './IMatrixEventContentCreateRoom';
import { IMatrixEventContentAddMemberToRoom } from './IMatrixEventContentAddMemberToRoom';
import { IMatrixEventContentSendMessage } from './IMatrixEventContentSendMessage';
import { IMatrixEventContentSetRoomJoinRules } from './IMatrixEventContentSetRoomJoinRules';
import { IMatrixEventContentSetRoomName } from './IMatrixEventContentSetRoomName';
import { IMatrixEventContentSetRoomTopic } from './IMatrixEventContentSetRoomTopic';

export type EventContent = {
	[MatrixEventType.CREATE_ROOM]: IMatrixEventContentCreateRoom;
	[MatrixEventType.ADD_MEMBER_TO_ROOM]: IMatrixEventContentAddMemberToRoom;
	[MatrixEventType.SET_ROOM_JOIN_RULES]: IMatrixEventContentSetRoomJoinRules;
	[MatrixEventType.SET_ROOM_NAME]: IMatrixEventContentSetRoomName;
	[MatrixEventType.SET_ROOM_TOPIC]: IMatrixEventContentSetRoomTopic;
	[MatrixEventType.SEND_MESSAGE]: IMatrixEventContentSendMessage;
};
