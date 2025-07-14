using demo.request from '../db/request';

service RequestService {
    entity Request       as projection on request.Request{
        *,
        createdAt,
        createdBy,
        modifiedAt,
        modifiedBy
    };
    entity Request_State as projection on request.Request_State;

}
