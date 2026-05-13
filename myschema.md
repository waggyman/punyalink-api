Postgres DB Schema:
    - stores:
        - id
        - subdomain unique
        - title
        - background
        - description
    
    - admins:
        - id
        - name
        - email
        - password
    
    - users:
        - id
        - name
        - email unique
        - password
        - store_id index

    - otps:
        - id
        - target
        - value
        - expired_at

    - links:
        - Image
        - name
        - external_link
        - access_link
        - view auto insert
        - click auto insert
        - source optional
        - is_public true by default
        - is_active true by default
        - store_id
        - index composite store_id + access_link unique

    
    - collections:
        - name
        - access_link
        - store_id
        - expired_at
        - index composite store_id + access_link_unique
    
    - link_collections:
        - link_id
        - collection_id
