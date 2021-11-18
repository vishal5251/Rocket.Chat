export enum MatrixEventType {
	CREATE_ROOM = 'm.room.create',
	ADD_MEMBER_TO_ROOM = 'm.room.member',
	SET_ROOM_POWER_LEVELS = 'm.room.power_levels',
	SET_ROOM_CANONICAL_ALIAS = 'm.room.canonical_alias',
	SET_ROOM_JOIN_RULES = 'm.room.join_rules',
	SET_ROOM_HISTORY_VISIBILITY = 'm.room.history_visibility',
	SET_ROOM_GUEST_ACCESS = 'm.room.guest_access',
	SET_ROOM_NAME = 'm.room.name',
	SET_ROOM_TOPIC = 'm.room.topic',
	SEND_MESSAGE = 'm.room.message',
}
