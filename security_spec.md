# Security Specification: Chess Firestore Zero-Trust Model

## 1. Data Invariants
- **Games**: Open lobby listings are restricted to games in the `waiting` status. Once a game has started (status `playing`, completed or resigned), list queries must be scoped strictly to the respective active participants.
- **Messages**: Users can only send message payloads in games that exist, and the `senderId` must match their verified `auth.uid`.
- **Users**: User profiles are globally readable to display active matchmaking status and Elo ratings in the lobby. Writing/updating a user profile requires matching the authenticated `userId`.

## 2. Threat Vector Evaluation ("Dirty Dozen")
1. **Unsigned-in Matchmaking Listing**: A Guest user should be allowed to view the matchmaking list but not query overall private/ongoing match archives.
2. **PII Exposure Bypass**: No personal emails or telephone data is stored in the public user profiles.
3. **Identity Spoofing**: Users cannot create user profile documents representing other accounts.
4. **Chat Hijacking**: A user cannot post a chat message in an active match with a spoofed `senderId` or representing another opponent.
5. **Move Hijacking**: Players cannot submit moves unless they are verified participants in the match.
6. **Lobby Scraping**: Users should be blocked from fetching list queries that pull in finished games they didn't participate in.
7. **Document ID poisoning**: Validates path params using regex `isValidId()` pattern.
8. **Shadow Field Injection**: Prevent users from injecting unexpected status parameters without proper state changes.
9. **Role Self-Escalation**: Admin的概念 is avoided since role 개념 doesn't exist in standard gameplay.
10. **Immutable Field Mutability**: Matches are locked on terminal states in the UI, and the rules permit matchmaking updates only to open slots.
11. **Denial of Wallet recursive lookups**: Resolutions avoid non-relational nested rules.
12. **Double joining**: A participant cannot double register as both Black and White players in a multiplayer matchmaking session.
