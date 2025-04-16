;; Contractor Verification Contract
;; Validates qualified service providers

(define-data-var contract-owner principal tx-sender)

;; Contractor data structure
(define-map contractors
  { contractor-id: uint }
  {
    name: (string-utf8 100),
    address: (string-utf8 100),
    contact: (string-utf8 100),
    specialties: (string-utf8 200),
    license-number: (string-utf8 50),
    is-verified: bool,
    verification-date: uint,
    registration-date: uint
  }
)

;; Contractor ID counter
(define-data-var next-contractor-id uint u1)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-CONTRACTOR-EXISTS u101)
(define-constant ERR-CONTRACTOR-NOT-FOUND u102)

;; Check if caller is contract owner
(define-private (is-contract-owner)
  (is-eq tx-sender (var-get contract-owner))
)

;; Register a new contractor
(define-public (register-contractor
    (name (string-utf8 100))
    (address (string-utf8 100))
    (contact (string-utf8 100))
    (specialties (string-utf8 200))
    (license-number (string-utf8 50)))
  (let ((contractor-id (var-get next-contractor-id)))
    (asserts! (is-none (map-get? contractors { contractor-id: contractor-id })) (err ERR-CONTRACTOR-EXISTS))

    (map-set contractors
      { contractor-id: contractor-id }
      {
        name: name,
        address: address,
        contact: contact,
        specialties: specialties,
        license-number: license-number,
        is-verified: false,
        verification-date: u0,
        registration-date: block-height
      }
    )

    (var-set next-contractor-id (+ contractor-id u1))
    (ok contractor-id)
  )
)

;; Verify a contractor (only contract owner can do this)
(define-public (verify-contractor (contractor-id uint))
  (let ((contractor (map-get? contractors { contractor-id: contractor-id })))
    (asserts! (is-contract-owner) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-some contractor) (err ERR-CONTRACTOR-NOT-FOUND))

    (map-set contractors
      { contractor-id: contractor-id }
      (merge (unwrap-panic contractor)
        {
          is-verified: true,
          verification-date: block-height
        }
      )
    )
    (ok true)
  )
)

;; Update contractor details
(define-public (update-contractor
    (contractor-id uint)
    (contact (string-utf8 100))
    (specialties (string-utf8 200)))
  (let ((contractor (map-get? contractors { contractor-id: contractor-id })))
    (asserts! (is-some contractor) (err ERR-CONTRACTOR-NOT-FOUND))

    ;; In a real implementation, we would check if the caller is the contractor
    ;; or has permission to update the contractor details

    (map-set contractors
      { contractor-id: contractor-id }
      (merge (unwrap-panic contractor)
        {
          contact: contact,
          specialties: specialties
        }
      )
    )
    (ok true)
  )
)

;; Get contractor details
(define-read-only (get-contractor (contractor-id uint))
  (map-get? contractors { contractor-id: contractor-id })
)

;; Check if contractor is verified
(define-read-only (is-contractor-verified (contractor-id uint))
  (let ((contractor (map-get? contractors { contractor-id: contractor-id })))
    (if (is-some contractor)
      (get is-verified (unwrap-panic contractor))
      false
    )
  )
)

;; Get total number of contractors
(define-read-only (get-contractor-count)
  (- (var-get next-contractor-id) u1)
)
