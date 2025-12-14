export const NOTIFY_MESSAGES = {
    KICK_VOTE: ({targetNickname, votes}) => 
        `Kick vote registered for user ${targetNickname} (${votes}/3)`,

    KICKED_FROM_CHANNEL_ADMIN: ({channelName}) =>
        `You were kicked from channel ${channelName} by the admin`,

    KICKED_FROM_CHANNEL_VOTE: ({channelName}) =>
        `You were kicked and banned from channel ${channelName} by vote`,

    KICK_SUCCESS: ({targetNickname}) =>
        `User ${targetNickname} was kicked`,

    
    REDUNDANT_KICK: () =>
        `You have already voted to kick this user`,
    
    USER_BANNED: () =>
        `You are banned from this channel`,


    INVITE_SENT: ({channelName, targetNickname}) => 
        `You invited ${targetNickname} to channel ${channelName}`,

    INVITED_TO_CHANNEL: ({channelName}) => 
        `You were invited to ${channelName}`,




    REVOKED: ({channelName}) => 
        `Your membership of channel ${channelName} has been revoked`,

    JOINED_CHANNEL: ({nickname}) => 
        `User ${nickname} joined the channel`,

    LEFT_CHANNEL: ({nickname}) => 
        `User ${nickname} left the channel`,

    CHANNEL_DELETED: ({channelName}) =>
        `The ${channelName} channel has been deleted`,



    PRIVATE_CHANNEL: () =>
       'Private channel cannot be joined without invitation',

    NOT_A_MEMBER: () =>
        'You are not a member of this channel', 

    ADMIN_ONLY: () =>
        'Only admins can perform this action',

}