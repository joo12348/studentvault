# StudentVault — Permission Matrix (MVP)

## Legend

- **Y** = Allowed
- **N** = Not allowed
- **O** = Own records only
- **B** = Own batch or assigned batch only
- **A** = All records (admin override)

---

## Users & Profiles

| Resource | Action | Student | Faculty | Admin |
|----------|--------|--------|---------|-------|
| Own profile | Read | Y | Y | Y |
| Own profile | Update | Y | Y | Y |
| Other student profile | Read | N | B | A |
| Other faculty profile | Read | N | N | A |
| Student account | Create | N | N | Y |
| Student account | Update | N | N | Y |
| Student account | Deactivate | N | N | Y |
| Faculty account | Create | N | N | Y |
| Faculty account | Update | N | N | Y |
| Faculty account | Deactivate | N | N | Y |

## Academic Structure

| Resource | Action | Student | Faculty | Admin |
|----------|--------|--------|---------|-------|
| Departments | Read | Y | Y | Y |
| Departments | Create/Update/Delete | N | N | Y |
| Batches | Read | Y | Y | Y |
| Batches | Create/Update/Delete | N | N | Y |
| Semesters | Read | Y | Y | Y |
| Semesters | Create/Update/Delete | N | N | Y |
| Subjects | Read | Y | Y | Y |
| Subjects | Create/Update/Delete | N | N | Y |

## Resources

| Resource | Action | Student | Faculty | Admin |
|----------|--------|--------|---------|-------|
| Browse approved resources | Read | Y (own batch) | Y (assigned batches) | A |
| Resource detail | Read | Y (if visible) | Y (if visible) | A |
| Upload resource | Create | Y | Y | Y |
| Edit metadata | Update | O | O | A |
| Delete own resource | Delete | O | O | A |
| Archive/restore resource | Update | N | N | Y |
| Approve resource | Update | N | N | Y |
| Reject resource | Update | N | N | Y |
| Download resource | Read | Y (if approved & visible) | Y (if approved & visible) | A |

## Resource Visibility Rules

| Uploader | Default Visibility | Can Change Visibility |
|----------|-------------------|----------------------|
| Student | Own batch | No |
| Faculty | Assigned batches (selectable) | Yes, select batches |
| Admin | All students | Yes, select batches or all |

## Resource Moderation

| Resource | Action | Student | Faculty | Admin |
|----------|--------|--------|---------|-------|
| View pending resources | Read | N | N | Y |
| Approve | Update | N | N | Y |
| Reject with reason | Update | N | N | Y |
| View moderation history | Read | N | N | Y |

## Bookmarks & Collections

| Resource | Action | Student | Faculty | Admin |
|----------|--------|--------|---------|-------|
| Bookmark resource | Create | Y (own) | Y (own) | N |
| Remove bookmark | Delete | O | O | N |
| View bookmarks | Read | O | O | N |
| Create collection | Create | Y (own) | N | N |
| Update collection | Update | O | N | N |
| Delete collection | Delete | O | N | N |
| Add resource to collection | Create | O (own collection) | N | N |
| Remove from collection | Delete | O (own collection) | N | N |
| View collection | Read | O | N | N |

## Ratings & Reports

| Resource | Action | Student | Faculty | Admin |
|----------|--------|--------|---------|-------|
| Rate resource | Create | Y (once per resource) | N | N |
| Update rating | Update | O | N | N |
| Delete rating | Delete | O | N | N |
| Report resource | Create | Y | Y | N |
| View reports | Read | N | N | Y |
| Handle report | Update | N | N | Y |

## Sharing

| Resource | Action | Student | Faculty | Admin |
|----------|--------|--------|---------|-------|
| Share resource (internal link) | Create | Y (approved resources) | Y (approved resources) | Y |
| View shared link | Read | Y (if authorized) | Y (if authorized) | Y |

## Faculty-Specific

| Resource | Action | Student | Faculty | Admin |
|----------|--------|--------|---------|-------|
| View own resource engagement | Read | N | Y (own) | A |
| View student activity on resource | Read | N | Y (own resources, authorized) | A |
| View batch engagement | Read | N | Y (assigned batches) | A |
| View assigned students | Read | N | Y (assigned) | A |

## Admin-Specific

| Resource | Action | Student | Faculty | Admin |
|----------|--------|--------|---------|-------|
| Platform analytics | Read | N | N | Y |
| Audit log | Read | N | N | Y |
| User management | CRUD | N | N | Y |
| Permission management | Update | N | N | Y |
| Category management | CRUD | N | N | Y |

## API Endpoint Authorization Rules

For every API endpoint, the backend must verify:

1. **Authentication**: Is the user logged in?
2. **Role**: Does the user have the required role?
3. **Ownership**: Does the user own the record (if applicable)?
4. **Relationship**: Is the user in the correct batch/department/subject (if applicable)?
5. **Status**: Is the resource in an允许状态 (e.g., approved for viewing)?

### Resource Access Decision Tree

```
User requests resource
  ↓
Is user authenticated? → No → 401
  ↓ Yes
Is user admin? → Yes → Full access
  ↓ No
Is resource approved? → No → 404 (hide existence)
  ↓ Yes
Is user faculty? → Yes → Check if resource is in assigned batches
  ↓ No (student)
Is resource visible to user's batch? → No → 404
  ↓ Yes
Allow read access
```

### Upload Access Decision Tree

```
User uploads resource
  ↓
Is user authenticated? → No → 401
  ↓ Yes
Is user student, faculty, or admin? → No → 403
  ↓ Yes
Validate file type, size, metadata
  ↓
Store file in object storage
  ↓
Create resource record with status:
  - Student → PENDING_REVIEW
  - Faculty → APPROVED
  - Admin → APPROVED
  ↓
Return resource metadata
```
