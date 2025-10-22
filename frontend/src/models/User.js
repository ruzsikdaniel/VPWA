export function createUser({
    id,
    firstName,
    lastName,
    nickname,
    email,
    password,
    color,
    channels = [],
    messages = []
}) {
    return { id, firstName, lastName, nickname, email, password, color, channels, messages};
}