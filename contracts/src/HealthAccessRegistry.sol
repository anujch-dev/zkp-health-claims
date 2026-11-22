// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HealthAccessRegistry
 * @notice Sovereign patient health record commitment registry and granular doctor access control
 * @dev Patient stores only cryptographic hashes/commitments on-chain; sensitive data remains
 *      AES-256 encrypted on off-chain storage (IPFS / Swarm).
 */
contract HealthAccessRegistry {
    struct EncryptedRecord {
        bytes32 recordId;
        bytes32 recordCommitmentHash; // SHA-256 or Poseidon hash of plaintext + secret salt
        string ipfsCid;              // IPFS CID of encrypted payload
        string category;             // e.g., "Diagnostic", "Prescription", "Lab Result"
        uint256 createdAt;
        bool exists;
    }

    struct AccessPermission {
        bool isGranted;
        uint256 grantedAt;
        uint256 expiresAt;
    }

    // patient => recordId => EncryptedRecord
    mapping(address => mapping(bytes32 => EncryptedRecord)) private _records;
    // patient => recordId list
    mapping(address => bytes32[]) private _patientRecordIds;

    // patient => doctor => recordId => AccessPermission
    mapping(address => mapping(address => mapping(bytes32 => AccessPermission))) private _doctorPermissions;

    // Events
    event RecordRegistered(
        address indexed patient,
        bytes32 indexed recordId,
        bytes32 recordCommitmentHash,
        string ipfsCid,
        string category,
        uint256 timestamp
    );

    event AccessGranted(
        address indexed patient,
        address indexed doctor,
        bytes32 indexed recordId,
        uint256 expiresAt
    );

    event AccessRevoked(
        address indexed patient,
        address indexed doctor,
        bytes32 indexed recordId,
        uint256 timestamp
    );

    // Custom Errors
    error RecordAlreadyExists(bytes32 recordId);
    error RecordNotFound(bytes32 recordId);
    error InvalidDoctorAddress();
    error AccessNotActive();
    error ZeroCommitment();

    /**
     * @notice Registers an off-chain encrypted medical record commitment
     * @param recordId Unique identifier for the medical record
     * @param recordCommitmentHash Cryptographic hash commitment of the record
     * @param ipfsCid Decentralized storage CID where encrypted record is pinned
     * @param category High-level medical category
     */
    function registerRecord(
        bytes32 recordId,
        bytes32 recordCommitmentHash,
        string calldata ipfsCid,
        string calldata category
    ) external {
        if (recordCommitmentHash == bytes32(0)) revert ZeroCommitment();
        if (_records[msg.sender][recordId].exists) revert RecordAlreadyExists(recordId);

        _records[msg.sender][recordId] = EncryptedRecord({
            recordId: recordId,
            recordCommitmentHash: recordCommitmentHash,
            ipfsCid: ipfsCid,
            category: category,
            createdAt: block.timestamp,
            exists: true
        });

        _patientRecordIds[msg.sender].push(recordId);

        emit RecordRegistered(
            msg.sender,
            recordId,
            recordCommitmentHash,
            ipfsCid,
            category,
            block.timestamp
        );
    }

    /**
     * @notice Grants a doctor access to decrypt and inspect a specific health record
     * @param recordId Record to grant access to
     * @param doctor Address of the consulting physician
     * @param durationInSeconds Time period for which access remains valid
     */
    function grantDoctorAccess(
        bytes32 recordId,
        address doctor,
        uint256 durationInSeconds
    ) external {
        if (doctor == address(0)) revert InvalidDoctorAddress();
        if (!_records[msg.sender][recordId].exists) revert RecordNotFound(recordId);

        uint256 expiresAt = block.timestamp + durationInSeconds;

        _doctorPermissions[msg.sender][doctor][recordId] = AccessPermission({
            isGranted: true,
            grantedAt: block.timestamp,
            expiresAt: expiresAt
        });

        emit AccessGranted(msg.sender, doctor, recordId, expiresAt);
    }

    /**
     * @notice Revokes a doctor's access permission to a medical record
     * @param recordId Record to revoke access from
     * @param doctor Address of the physician
     */
    function revokeDoctorAccess(bytes32 recordId, address doctor) external {
        if (doctor == address(0)) revert InvalidDoctorAddress();
        if (!_records[msg.sender][recordId].exists) revert RecordNotFound(recordId);
        if (!_doctorPermissions[msg.sender][doctor][recordId].isGranted) revert AccessNotActive();

        _doctorPermissions[msg.sender][doctor][recordId].isGranted = false;

        emit AccessRevoked(msg.sender, doctor, recordId, block.timestamp);
    }

    /**
     * @notice Checks if a doctor currently holds active permission to inspect a patient's record
     */
    function hasActiveAccess(
        address patient,
        address doctor,
        bytes32 recordId
    ) external view returns (bool) {
        AccessPermission memory perm = _doctorPermissions[patient][doctor][recordId];
        return perm.isGranted && block.timestamp <= perm.expiresAt;
    }

    /**
     * @notice Retrieves record metadata (accessible by patient or actively permitted doctor)
     */
    function getRecord(
        address patient,
        bytes32 recordId
    ) external view returns (
        bytes32 commitmentHash,
        string memory ipfsCid,
        string memory category,
        uint256 createdAt
    ) {
        if (!_records[patient][recordId].exists) revert RecordNotFound(recordId);

        bool isOwner = (msg.sender == patient);
        AccessPermission memory perm = _doctorPermissions[patient][msg.sender][recordId];
        bool isPermitted = perm.isGranted && block.timestamp <= perm.expiresAt;

        require(isOwner || isPermitted, "Unauthorized access to record metadata");

        EncryptedRecord memory rec = _records[patient][recordId];
        return (rec.recordCommitmentHash, rec.ipfsCid, rec.category, rec.createdAt);
    }

    /**
     * @notice Returns list of record IDs owned by the caller
     */
    function getMyRecordIds() external view returns (bytes32[] memory) {
        return _patientRecordIds[msg.sender];
    }
}
