package com.safenexus.app.data

import org.json.JSONObject
import java.time.LocalDate

data class SafeNexusUser(
    val displayName: String,
    val email: String,
)

data class BootstrapData(
    val workOrders: List<WorkOrder> = emptyList(),
    val companies: List<MobileRecord> = emptyList(),
    val locations: List<MobileRecord> = emptyList(),
    val workOrderStatuses: List<OptionItem> = emptyList(),
    val priorities: List<OptionItem> = emptyList(),
    val workOrderCompanies: List<WorkOrderCompanyOption> = emptyList(),
    val workOrderLocations: List<WorkOrderLocationOption> = emptyList(),
    val workOrderUsers: List<WorkOrderUserOption> = emptyList(),
    val workOrderServices: List<WorkOrderServiceOption> = emptyList(),
    val workOrderLocationObjects: List<WorkOrderLocationObjectOption> = emptyList(),
    val vehicles: List<MobileRecord> = emptyList(),
    val measurementEquipmentRecords: List<MobileRecord> = emptyList(),
    val documentRecords: List<MobileRecord> = emptyList(),
    val peopleTrainingRecords: List<MobileRecord> = emptyList(),
    val clientPortalRecords: List<MobileRecord> = emptyList(),
    val rulebooks: List<MobileRecord> = emptyList(),
    val riskAssessmentRecords: List<MobileRecord> = emptyList(),
    val jobs: List<MobileRecord> = emptyList(),
    val offers: List<MobileRecord> = emptyList(),
    val fieldInquiries: List<MobileRecord> = emptyList(),
    val todoTasks: List<MobileRecord> = emptyList(),
    val calendarEvents: List<MobileRecord> = emptyList(),
    val dashboard: DashboardStats = DashboardStats(),
)

data class OptionItem(
    val value: String,
    val label: String,
)

data class WorkOrderCompanyOption(
    val id: String,
    val name: String,
    val oib: String,
    val headquarters: String,
    val contractType: String,
    val contactPhone: String,
    val contactEmail: String,
)

data class WorkOrderLocationOption(
    val id: String,
    val companyId: String,
    val name: String,
    val coordinates: String,
    val region: String,
    val contactName1: String,
    val contactPhone1: String,
    val contactEmail1: String,
    val contactName2: String,
    val contactPhone2: String,
    val contactEmail2: String,
    val contactName3: String,
    val contactPhone3: String,
    val contactEmail3: String,
)

data class WorkOrderLocationCreateDraft(
    val companyId: String,
    val name: String,
    val region: String,
    val coordinates: String,
    val contactName: String,
    val contactPhone: String,
    val contactEmail: String,
    val note: String,
)

data class WorkOrderUserOption(
    val id: String,
    val label: String,
    val fullName: String,
    val email: String,
    val oib: String,
    val isznrTags: List<String>,
)

data class WorkOrderServiceOption(
    val id: String,
    val name: String,
    val serviceCode: String,
    val type: String,
    val validityMonths: String,
    val note: String,
)

data class WorkOrderLocationObjectOption(
    val id: String,
    val companyId: String,
    val locationId: String,
    val name: String,
    val code: String,
    val description: String,
)

data class WorkOrderServiceItem(
    val serviceId: String,
    val name: String,
    val serviceCode: String,
    val serviceStatus: String,
    val quantity: String,
) {
    val displayLabel: String
        get() = listOf(serviceCode, name).filter { it.isNotBlank() }.joinToString(" · ").ifBlank { "Usluga" }
}

data class WorkOrderCreateDraft(
    val companyId: String,
    val locationId: String,
    val status: String,
    val openedDate: String,
    val dueDate: String,
    val executionDate: String,
    val priority: String,
    val serviceLine: String,
    val serviceIds: List<String>,
    val description: String,
    val executors: List<String>,
    val completedBy: String,
    val teamLabel: String,
    val contactName: String,
    val contactPhone: String,
    val contactEmail: String,
    val tagText: String,
    val invoiceNote: String,
    val linkReference: String,
    val department: String,
)

data class FieldInquiryDraft(
    val id: String = "",
    val title: String,
    val status: String,
    val plannedDate: String,
    val timeFrom: String,
    val timeTo: String,
    val companyId: String,
    val locationId: String,
    val workOrderId: String,
    val vehicleId: String,
    val contactName: String,
    val contactPhone: String,
    val serviceLine: String,
    val note: String,
    val assignedUserIds: List<String>,
    val assignedUserLabels: List<String>,
    val syncWorkOrderExecutionDate: Boolean,
)

data class JobCreateDraft(
    val title: String,
    val status: String,
    val description: String,
)

data class RiskAssessmentJobDraft(
    val sourceJobId: String,
    val jobTitle: String,
    val description: String,
    val tasks: String,
    val workerCount: String = "",
    val workplace: String = "",
    val workSchedule: String = "",
    val workOrganization: String = "",
    val workEnvironment: String = "",
    val workEquipment: String = "",
    val toolsAndMachines: String = "",
    val workSubstances: String = "",
    val trainings: String = "",
    val medicalExams: String = "",
    val ppeText: String = "",
    val note: String = "",
    val riskRows: List<RiskAssessmentRiskRowDraft> = emptyList(),
    val ppeItems: List<RiskAssessmentPpeDraft> = emptyList(),
)

data class RiskAssessmentOrganizationUnitDraft(
    val name: String,
    val type: String,
    val responsiblePerson: String,
    val workerCount: String,
    val description: String,
)

data class RiskAssessmentRiskRowDraft(
    val hazard: String,
    val source: String,
    val possibleConsequences: String,
    val riskLevel: String,
    val existingMeasures: String,
    val additionalMeasures: String,
    val measures: String,
)

data class RiskAssessmentPpeDraft(
    val name: String,
    val category: String,
    val norm: String,
    val description: String,
)

data class RiskAssessmentMeasureDraft(
    val measure: String,
    val deadline: String,
    val responsiblePerson: String,
    val controlMethod: String,
    val status: String,
)

data class RiskAssessmentChemicalDraft(
    val name: String,
    val casNumber: String,
    val classification: String,
    val hazardStatements: String,
    val ppe: String,
    val storage: String,
    val note: String,
)

data class RiskAssessmentBiologicalDraft(
    val agentName: String,
    val category: String,
    val group: String,
    val source: String,
    val possibleConsequences: String,
    val existingMeasures: String,
    val note: String,
)

data class RiskAssessmentManualHandlingDraft(
    val activity: String,
    val jobTitle: String,
    val loadWeightKg: String,
    val transfersPerHour: String,
    val carryingDistanceMeters: String,
    val posture: String,
    val workConditions: String,
    val note: String,
)

data class RiskAssessmentCreateDraft(
    val companyId: String,
    val companyName: String,
    val locationId: String,
    val locationName: String,
    val workOrderId: String,
    val workOrderNumber: String,
    val title: String,
    val status: String,
    val assessmentDate: String,
    val revisionDate: String,
    val completionDate: String = "",
    val assessmentNumber: String = "",
    val teamLead: String = "",
    val collaborators: String = "",
    val employerFullName: String = "",
    val employerAddress: String = "",
    val employerMbs: String = "",
    val employerOib: String = "",
    val employerNkdActivity: String = "",
    val employerEmployeeCount: String = "",
    val employerHeadquarters: String = "",
    val employerDetachedLocations: String = "",
    val znrServiceMode: String = "",
    val znrExperts: String = "",
    val znrRepresentatives: String = "",
    val znrCommitteeParticipation: String = "",
    val intro: String,
    val workProcessDescription: String,
    val generalData: String,
    val computerWorkplaces: String = "",
    val basicRules: String = "",
    val specialRules: String = "",
    val omissionsBasic: String = "",
    val omissionsSpecial: String = "",
    val conclusion: String,
    val biologicalHazards: String = "",
    val clientNote: String = "",
    val clientJobInputEnabled: Boolean = false,
    val organizationUnits: List<RiskAssessmentOrganizationUnitDraft> = emptyList(),
    val jobs: List<RiskAssessmentJobDraft>,
    val measures: List<RiskAssessmentMeasureDraft> = emptyList(),
    val chemicals: List<RiskAssessmentChemicalDraft> = emptyList(),
    val biologicalRisks: List<RiskAssessmentBiologicalDraft> = emptyList(),
    val manualHandling: List<RiskAssessmentManualHandlingDraft> = emptyList(),
)

data class WorkOrderDocumentationDraft(
    val objectId: String,
    val objectName: String,
    val inspectionDate: String,
    val issuedDate: String,
    val issuedPlace: String,
    val testingLocation: String,
    val note: String,
    val inspectionType: String,
    val completedBy: String = "",
    val outsideTemperature: String,
    val relativeHumidity: String,
    val airflowSpeed: String,
    val weather: String,
    val groundCondition: String,
    val groundResistance: String,
    val measurementEquipmentGroup: String,
    val selectedEquipmentIds: List<String> = emptyList(),
    val selectedLegalFrameworkIds: List<String> = emptyList(),
    val selectedRulebookIds: List<String> = emptyList(),
    val selectedWorkEquipmentRecords: List<WorkOrderDocumentationOption> = emptyList(),
    val selectedWorkEnvironmentRecords: List<WorkOrderDocumentationOption> = emptyList(),
    val manualWorkEquipments: List<IsznrManualWorkEquipment> = emptyList(),
    val workEquipmentSubmitResult: IsznrWorkEquipmentSubmitResult = IsznrWorkEquipmentSubmitResult(),
    val workEnvironmentSubmitResult: IsznrWorkEquipmentSubmitResult = IsznrWorkEquipmentSubmitResult(),
    val signatureMode: String,
    val validityMonths: String,
    val electricalValidityMonths: String,
    val tipkaloValidityMonths: String,
    val serviceValidityMonths: Map<String, String> = emptyMap(),
    val executors: List<String> = emptyList(),
    val inspectorUserIds: List<String>,
    val inspectorUserId: String,
    val authorizationHolderUserId: String,
    val electricalInspectorUserIds: List<String>,
    val electricalInspectorUserId: String,
    val electricalAuthorizationHolderUserId: String,
    val tipkaloInspectorUserIds: List<String>,
    val tipkaloInspectorUserId: String,
    val tipkaloAuthorizationHolderUserId: String,
    val workEquipmentInspectorUserIds: List<String> = emptyList(),
    val workEquipmentInspectorUserId: String = "",
    val workEquipmentAuthorizationHolderUserId: String = "",
    val workEnvironmentInspectorUserIds: List<String> = emptyList(),
    val workEnvironmentInspectorUserId: String = "",
    val workEnvironmentAuthorizationHolderUserId: String = "",
    val handoverVerifierUserId: String = "",
    val fieldValues: Map<String, String> = emptyMap(),
    val templateFieldValues: Map<String, Map<String, String>> = emptyMap(),
    val fieldSheets: Map<String, WorkOrderMeasurementSheet> = emptyMap(),
    val templateFieldSheets: Map<String, Map<String, WorkOrderMeasurementSheet>> = emptyMap(),
    val additionalRecords: List<WorkOrderDocumentationAdditionalRecord> = emptyList(),
    val includeHandoverProtocol: Boolean = true,
)

data class WorkOrderDocumentationAdditionalRecord(
    val serviceKey: String,
    val serviceIndex: Int,
    val serviceCode: String,
    val serviceName: String,
    val objectId: String,
    val objectName: String,
)

data class WorkOrderDocumentationContext(
    val workOrderId: String = "",
    val workOrderNumber: String = "",
    val templates: List<WorkOrderDocumentationTemplate> = emptyList(),
    val hasTemplates: Boolean = false,
    val fieldCount: Int = 0,
    val templateBlockCount: Int = 0,
    val measurementTableCount: Int = 0,
    val defaults: WorkOrderDocumentationDefaults = WorkOrderDocumentationDefaults(),
    val measurementEquipmentOptions: List<WorkOrderDocumentationOption> = emptyList(),
    val workEquipmentOptions: List<WorkOrderDocumentationOption> = emptyList(),
    val workEquipmentMechanicalOptions: List<WorkOrderDocumentationOption> = emptyList(),
    val workEquipmentElectricalOptions: List<WorkOrderDocumentationOption> = emptyList(),
    val workEquipmentHazardOptions: List<WorkOrderDocumentationOption> = emptyList(),
    val workEquipmentHarmfulnessOptions: List<WorkOrderDocumentationOption> = emptyList(),
    val workEquipmentStrainOptions: List<WorkOrderDocumentationOption> = emptyList(),
    val workEquipmentStatus: Map<String, String> = emptyMap(),
    val workEnvironmentOptions: List<WorkOrderDocumentationOption> = emptyList(),
    val workEnvironmentStatus: Map<String, String> = emptyMap(),
    val legalFrameworkOptions: List<WorkOrderDocumentationOption> = emptyList(),
    val rulebookOptions: List<WorkOrderDocumentationOption> = emptyList(),
    val signaturePersonOptions: List<WorkOrderDocumentationSignatureAreaOptions> = emptyList(),
)

data class IsznrWorkEquipmentSubmitResult(
    val message: String = "",
    val isznrId: String = "",
    val recordNumber: String = "",
    val pdfUrl: String = "",
    val pdfBridgeUrl: String = "",
    val attachmentSubmitted: Int = 0,
    val attachmentFailed: Int = 0,
    val equipmentCount: Int = 0,
    val submittedAt: String = "",
)

data class IsznrRoAttachmentFile(
    val id: String = "",
    val fileName: String = "",
    val fileType: String = "",
    val fileSize: Long = 0,
    val contentDataUrl: String = "",
)

data class IsznrManualWorkEquipment(
    val name: String = "",
    val manufacturer: String = "",
    val model: String = "",
    val serialNumber: String = "",
    val inventoryNumber: String = "",
    val note: String = "",
    val technicalData: String = "",
    val purposeDescription: String = "",
    val workspacePosition: String = "",
    val workingSubstancesAndRawMaterials: String = "",
    val useAndMaintenance: String = "",
    val methodsProceduresAndNorms: String = "",
    val deficiencies: String = "",
    val measuresToEliminateDeficiencies: String = "",
    val finalGrade: String = "1",
    val mechanicalItems: List<IsznrRoAssessmentItem> = emptyList(),
    val electricalItems: List<IsznrRoAssessmentItem> = emptyList(),
    val hazardRegisterIris: List<String> = emptyList(),
    val harmfulnessRegisterIris: List<String> = emptyList(),
    val strainRegisterIris: List<String> = emptyList(),
    val attachments: List<IsznrRoAttachmentFile> = emptyList(),
)

data class IsznrManualPhysicalFactors(
    val location: String = "",
    val startDate: String = "",
    val endDate: String = "",
    val deadlineForNextExamination: String = "",
    val technicalDocumentation: String = "",
    val methodsProceduresAndNorms: String = "",
    val workProcessConditions: String = "",
    val airTemperature: String = "",
    val relativeAirHumidity: String = "",
    val airFlowSpeed: String = "",
    val typesOfExamination: List<String> = listOf("2", "3"),
    val spaces: List<IsznrFcSpaceDraft> = listOf(IsznrFcSpaceDraft()),
    val measurements: List<IsznrFcMeasurementDraft> = listOf(IsznrFcMeasurementDraft()),
)

data class IsznrFcSpaceDraft(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val workProcess: String = "",
    val workEquipment: String = "",
    val finalGrade: String = "1",
    val temperatureAllowed: String = "",
    val temperatureMin: String = "",
    val temperatureMax: String = "",
    val humidityAllowed: String = "",
    val humidityMin: String = "",
    val humidityMax: String = "",
    val airflowAllowed: String = "",
    val airflowMin: String = "",
    val airflowMax: String = "",
    val illuminationAllowed: String = "",
    val illuminationMin: String = "",
    val illuminationMax: String = "",
    val noiseAllowed: String = "",
    val noiseMin: String = "",
    val noiseMax: String = "",
    val handArmVibrationLimit: String = "",
    val handArmVibrationWarning: String = "",
    val handArmVibrationMin: String = "",
    val handArmVibrationMax: String = "",
    val wholeBodyVibrationLimit: String = "",
    val wholeBodyVibrationWarning: String = "",
    val wholeBodyVibrationMin: String = "",
    val wholeBodyVibrationMax: String = "",
)

data class IsznrFcMeasurementDraft(
    val id: String = "",
    val spaceId: String = "",
    val type: String = "illumination",
    val measuringPlace: String = "",
    val measuredValue: String = "",
    val allowedValue: String = "",
    val note: String = "",
    val finalGrade: String = "1",
)

data class IsznrRoAssessmentItem(
    val registerIri: String = "",
    val label: String = "",
    val customContent: String = "",
    val measuredValue: String = "",
    val meetsConditions: Boolean = true,
)

data class WorkOrderDocumentationDefaults(
    val inspectionDate: String = "",
    val issuedDate: String = "",
    val issuedPlace: String = "",
    val testingLocation: String = "",
    val note: String = "",
    val inspectionType: String = "",
    val outsideTemperature: String = "",
    val relativeHumidity: String = "",
    val airflowSpeed: String = "",
    val weather: String = "",
    val groundCondition: String = "",
    val groundResistance: String = "",
    val measurementEquipmentGroup: String = "",
    val selectedEquipmentIds: List<String> = emptyList(),
    val selectedLegalFrameworkIds: List<String> = emptyList(),
    val selectedRulebookIds: List<String> = emptyList(),
    val signatureMode: String = "",
    val validityMonths: String = "",
    val electricalValidityMonths: String = "",
    val tipkaloValidityMonths: String = "",
    val serviceValidityMonths: Map<String, String> = emptyMap(),
    val fieldValues: Map<String, String> = emptyMap(),
    val templateFieldValues: Map<String, Map<String, String>> = emptyMap(),
    val fieldSheets: Map<String, WorkOrderMeasurementSheet> = emptyMap(),
    val templateFieldSheets: Map<String, Map<String, WorkOrderMeasurementSheet>> = emptyMap(),
)

data class WorkOrderDocumentationOption(
    val id: String,
    val label: String,
    val subtitle: String = "",
    val status: String = "",
    val meta: Map<String, String> = emptyMap(),
)

data class WorkOrderDocumentationSignatureAreaOptions(
    val key: String,
    val label: String,
    val inspectorOptions: List<WorkOrderDocumentationOption> = emptyList(),
    val authorizationOptions: List<WorkOrderDocumentationOption> = emptyList(),
    val defaultInspectorIds: List<String> = emptyList(),
    val defaultAuthorizationHolderId: String = "",
)

data class WorkOrderDocumentationTemplate(
    val id: String,
    val title: String,
    val documentType: String,
    val serviceName: String,
    val serviceCode: String = "",
    val serviceIndex: Int = -1,
    val signatureAreas: List<String> = emptyList(),
    val documentNumber: String = "",
    val documentName: String = "",
    val dataSourceType: String = "",
    val dataSourceTitle: String = "",
    val dataSourceDate: String = "",
    val dataSourceWorkOrderNumber: String = "",
    val fields: List<WorkOrderDocumentationField>,
    val fieldBlocks: List<WorkOrderDocumentationTemplateBlock> = emptyList(),
    val inspectionTypeOptions: List<OptionItem> = emptyList(),
    val measurementTables: List<WorkOrderMeasurementTable>,
    val aiFields: List<WorkOrderDocumentationAiField> = emptyList(),
    val aiMeasurementColumns: List<WorkOrderDocumentationAiMeasurementColumn> = emptyList(),
)

data class WorkOrderDocumentationAiField(
    val id: String,
    val key: String,
    val label: String,
    val type: String,
    val fieldType: String,
    val required: Boolean,
    val ai: JSONObject = JSONObject(),
    val valueShape: String = "",
    val sectionSubtitle: String = "",
    val systemRows: List<WorkOrderDocumentationAiSystemRow> = emptyList(),
)

data class WorkOrderDocumentationAiSystemRow(
    val id: String,
    val subtitle: String,
    val lineCount: Int,
    val placeholder: String,
)

data class WorkOrderDocumentationAiMeasurementColumn(
    val fieldId: String,
    val fieldKey: String,
    val fieldLabel: String,
    val fieldDescription: String,
    val columnId: String,
    val columnIndex: Int,
    val columnLetter: String,
    val key: String,
    val label: String,
    val type: String,
    val required: Boolean,
    val placeholder: String,
    val helpText: String,
    val aiMapping: JSONObject = JSONObject(),
)

data class WorkOrderDocumentationTemplateBlock(
    val id: String,
    val key: String,
    val tokenKey: String,
    val label: String,
    val type: String,
    val typeLabel: String,
    val group: String,
    val required: Boolean,
    val editable: Boolean,
    val helpText: String,
    val summary: String,
    val options: List<OptionItem>,
    val signatureArea: String = "",
    val signatureRole: String = "",
    val signatureMultiple: Boolean = true,
    val signatureMetaFields: List<String> = emptyList(),
)

data class WorkOrderDocumentationField(
    val id: String,
    val key: String,
    val tokenKey: String,
    val label: String,
    val type: String,
    val required: Boolean,
    val helpText: String,
    val defaultValue: String,
    val options: List<OptionItem>,
    val signatureArea: String = "",
    val signatureRole: String = "",
    val signatureMultiple: Boolean = true,
    val signatureMetaFields: List<String> = emptyList(),
)

data class WorkOrderMeasurementTable(
    val id: String,
    val key: String,
    val tokenKey: String,
    val label: String,
    val helpText: String,
    val summary: String,
    val sheet: WorkOrderMeasurementSheet,
)

data class WorkOrderMeasurementSheet(
    val columns: List<WorkOrderMeasurementColumn> = emptyList(),
    val rows: List<WorkOrderMeasurementRow> = emptyList(),
    val merges: List<WorkOrderMeasurementMerge> = emptyList(),
    val headerRows: List<String> = emptyList(),
)

data class WorkOrderMeasurementColumn(
    val id: String,
    val label: String,
    val placeholder: String,
    val width: Int,
    val computed: String,
    val readonly: Boolean,
)

data class WorkOrderMeasurementRow(
    val id: String,
    val cells: Map<String, String>,
    val formats: Map<String, JSONObject> = emptyMap(),
)

data class WorkOrderMeasurementMerge(
    val rowId: String,
    val columnId: String,
    val rowSpan: Int,
    val colSpan: Int,
)

data class DashboardStats(
    val workOrdersTotal: Int = 0,
    val activeWorkOrders: Int = 0,
    val overdueWorkOrders: Int = 0,
    val closedWorkOrders: Int = 0,
    val vehiclesTotal: Int = 0,
    val reservationsTotal: Int = 0,
    val documentsTotal: Int = 0,
    val trainingsTotal: Int = 0,
    val clientPortalTotal: Int = 0,
    val rulebooksTotal: Int = 0,
    val riskAssessmentsTotal: Int = 0,
    val measurementEquipmentTotal: Int = 0,
)

data class MobileRecord(
    val id: String,
    val title: String,
    val subtitle: String,
    val status: String,
    val kind: String,
    val date: String,
    val relatedId: String,
    val coordinates: String,
    val meta: Map<String, String> = emptyMap(),
) {
    val parsedDate: LocalDate? = parseDateOrNull(date)

    fun matchesSearch(query: String): Boolean {
        if (query.isBlank()) return true
        return title.contains(query, ignoreCase = true) ||
            subtitle.contains(query, ignoreCase = true) ||
            status.contains(query, ignoreCase = true) ||
            kind.contains(query, ignoreCase = true) ||
            date.contains(query, ignoreCase = true) ||
            meta.values.any { value -> value.contains(query, ignoreCase = true) }
    }
}

data class WorkOrder(
    val id: String,
    val number: String,
    val status: String,
    val companyId: String,
    val companyName: String,
    val companyOib: String,
    val headquarters: String,
    val locationId: String,
    val locationName: String,
    val objectId: String,
    val objectName: String,
    val coordinates: String,
    val region: String,
    val serviceLine: String,
    val serviceItems: List<String>,
    val serviceDetails: List<WorkOrderServiceItem>,
    val openedDate: String,
    val dueDate: String,
    val executionDate: String,
    val priority: String,
    val contactName: String,
    val contactPhone: String,
    val contactEmail: String,
    val description: String,
    val executors: List<String>,
    val completedBy: String = "",
) {
    val parsedDueDate: LocalDate? = parseDateOrNull(dueDate)

    val parsedExecutionDate: LocalDate? = parseDateOrNull(executionDate)

    val parsedOpenedDate: LocalDate? = parseDateOrNull(openedDate)

    val coordinatePoint: CoordinatePoint? = parseCoordinatePoint(coordinates)

    val displayNumber: String
        get() = number.ifBlank { "RN" }

    val displayService: String
        get() = serviceLine.ifBlank { serviceItems.joinToString(" - ") }.ifBlank { "Bez upisane usluge" }

    val hasCoordinates: Boolean
        get() = coordinatePoint != null

    val isClosed: Boolean
        get() = status.equals("Gotov RN", ignoreCase = true) ||
            status.equals("Ovjeren RN", ignoreCase = true) ||
            status.equals("Fakturiran RN", ignoreCase = true) ||
            status.equals("Storno RN", ignoreCase = true) ||
            status.equals("Storniran RN", ignoreCase = true)

    val isOverdue: Boolean
        get() = !isClosed && parsedDueDate?.isBefore(LocalDate.now()) == true
}

data class WorkOrderDocument(
    val id: String,
    val workOrderId: String,
    val fileName: String,
    val fileType: String,
    val fileSize: Long,
    val documentCategory: String,
    val description: String,
    val sourceType: String,
    val createdAt: String,
) {
    val displayName: String
        get() = fileName.ifBlank { documentCategory.ifBlank { "Dokument" } }

    val isImage: Boolean
        get() = fileType.startsWith("image/", ignoreCase = true) ||
            fileName.substringAfterLast('.', "").lowercase() in setOf("jpg", "jpeg", "png", "webp")

    val isPdf: Boolean
        get() = fileType.equals("application/pdf", ignoreCase = true) ||
            fileName.endsWith(".pdf", ignoreCase = true)
}

data class WorkOrderUploadFile(
    val fileName: String,
    val fileType: String,
    val fileSize: Long,
    val documentCategory: String,
    val description: String,
    val bytes: ByteArray,
)

data class WorkOrderDocumentationAiFile(
    val id: String,
    val name: String,
    val type: String,
    val size: Long,
    val contentDataUrl: String,
)

data class WorkOrderDocumentationAiResult(
    val dryRun: Boolean = false,
    val modelLabel: String = "",
    val message: String = "",
    val fieldSuggestions: List<WorkOrderDocumentationAiFieldSuggestion> = emptyList(),
    val measurementSuggestions: List<WorkOrderDocumentationAiMeasurementSuggestion> = emptyList(),
    val warnings: List<String> = emptyList(),
)

data class WorkOrderDocumentationAiFieldSuggestion(
    val fieldId: String,
    val fieldKey: String,
    val fieldLabel: String,
    val valueText: String,
    val rawValueJson: String,
    val confidence: String,
    val reason: String,
    val sourceFile: String,
)

data class WorkOrderDocumentationAiMeasurementSuggestion(
    val fieldId: String,
    val fieldKey: String,
    val fieldLabel: String,
    val rows: List<WorkOrderDocumentationAiMeasurementRowSuggestion> = emptyList(),
    val confidence: String,
    val sourceFile: String,
)

data class WorkOrderDocumentationAiMeasurementRowSuggestion(
    val values: Map<String, String> = emptyMap(),
    val orderedValues: List<String> = emptyList(),
    val confidence: String,
    val sourceFile: String,
)

data class DownloadedDocument(
    val fileName: String,
    val fileType: String,
    val bytes: ByteArray,
)

fun parseDateOrNull(value: String): LocalDate? = runCatching {
    if (value.isBlank()) null else LocalDate.parse(value.take(10))
}.getOrNull()

data class CoordinatePoint(
    val latitude: Double,
    val longitude: Double,
)

private val coordinateNumberPattern = Regex("""[-+]?\d{1,3}(?:[.,]\d+)?""")

fun parseCoordinatePoint(value: String): CoordinatePoint? {
    val numbers = coordinateNumberPattern.findAll(value)
        .mapNotNull { match -> match.value.replace(',', '.').toDoubleOrNull() }
        .toList()

    if (numbers.size < 2) return null

    val latitude = numbers[0]
    val longitude = numbers[1]

    if (latitude !in -90.0..90.0 || longitude !in -180.0..180.0) {
        return null
    }

    return CoordinatePoint(latitude, longitude)
}
