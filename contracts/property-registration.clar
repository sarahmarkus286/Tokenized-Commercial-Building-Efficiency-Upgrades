;; Property Registration Contract
;; Records details of commercial structures

(define-data-var contract-owner principal tx-sender)

;; Property data structure
(define-map properties
  { property-id: uint }
  {
    owner: principal,
    address: (string-utf8 100),
    square-footage: uint,
    building-type: (string-utf8 50),
    construction-year: uint,
    baseline-energy-usage: uint,
    registration-date: uint
  }
)

;; Property ID counter
(define-data-var next-property-id uint u1)

;; Error codes
(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-PROPERTY-EXISTS u101)
(define-constant ERR-PROPERTY-NOT-FOUND u102)

;; Check if caller is contract owner
(define-private (is-contract-owner)
  (is-eq tx-sender (var-get contract-owner))
)

;; Register a new property
(define-public (register-property
    (address (string-utf8 100))
    (square-footage uint)
    (building-type (string-utf8 50))
    (construction-year uint)
    (baseline-energy-usage uint))
  (let ((property-id (var-get next-property-id)))
    (asserts! (is-none (map-get? properties { property-id: property-id })) (err ERR-PROPERTY-EXISTS))

    (map-set properties
      { property-id: property-id }
      {
        owner: tx-sender,
        address: address,
        square-footage: square-footage,
        building-type: building-type,
        construction-year: construction-year,
        baseline-energy-usage: baseline-energy-usage,
        registration-date: block-height
      }
    )

    (var-set next-property-id (+ property-id u1))
    (ok property-id)
  )
)

;; Update property details
(define-public (update-property
    (property-id uint)
    (square-footage uint)
    (baseline-energy-usage uint))
  (let ((property (map-get? properties { property-id: property-id })))
    (asserts! (is-some property) (err ERR-PROPERTY-NOT-FOUND))
    (asserts! (is-eq tx-sender (get owner (unwrap-panic property))) (err ERR-NOT-AUTHORIZED))

    (map-set properties
      { property-id: property-id }
      (merge (unwrap-panic property)
        {
          square-footage: square-footage,
          baseline-energy-usage: baseline-energy-usage
        }
      )
    )
    (ok true)
  )
)

;; Get property details
(define-read-only (get-property (property-id uint))
  (map-get? properties { property-id: property-id })
)

;; Check if caller is property owner
(define-read-only (is-property-owner (property-id uint) (caller principal))
  (let ((property (map-get? properties { property-id: property-id })))
    (if (is-some property)
      (is-eq caller (get owner (unwrap-panic property)))
      false
    )
  )
)

;; Get total number of registered properties
(define-read-only (get-property-count)
  (- (var-get next-property-id) u1)
)
