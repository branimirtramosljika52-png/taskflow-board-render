package com.safenexus.app.data

import com.safenexus.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.CookieHandler
import java.net.CookieManager
import java.net.CookiePolicy
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.net.URL
import java.time.LocalDate
import java.util.Base64
import java.util.Locale
import java.util.zip.GZIPInputStream

private const val RO_ASSESSMENT_NOTE_MAX_LENGTH = 255
private const val RO_BATCH_AI_MAX_FILES = 80
private val RO_ASSESSMENT_UNVERIFIED_NOTE_REGEX = Regex(
    "(treba|potrebno je|potrebno|mora se|nuzno je|nužno je|nije moguce|nije moguće|ne moze se|ne može se|za rucnu|za ručnu|za dodatnu|dodatno)\\s+(provjeriti|potvrditi|utvrditi|pregledati|ispitati|provjeru|potvrdu|provjera|potvrda)|za provjeru|za potvrdu|rucna provjera|ručna provjera|rucna potvrda|ručna potvrda|nije sigurno|nema sigurnog dokaza",
    RegexOption.IGNORE_CASE,
)
private val RO_ASSESSMENT_PHOTO_FINDING_CLEANUPS: List<Pair<Regex, String>> = listOf(
    Regex("\\b(?:na\\s+)?(?:fotografiji|fotografijama|slici|slikama|fotki|fotkama)\\s+se\\s+vidi\\s+da\\s+(?:je|su)\\s*", RegexOption.IGNORE_CASE) to "",
    Regex("\\bvidi\\s+se\\s+da\\s+(?:je|su)\\s*", RegexOption.IGNORE_CASE) to "",
    Regex("\\b(?:na\\s+)?(?:fotografiji|fotografijama|slici|slikama|fotki|fotkama)\\s+se\\s+vidi\\s+da\\s*", RegexOption.IGNORE_CASE) to "",
    Regex("\\bvidi\\s+se\\s+da\\s*", RegexOption.IGNORE_CASE) to "",
    Regex("\\bvidljivo\\s+je\\s+da\\s*", RegexOption.IGNORE_CASE) to "",
    Regex("\\b(?:na\\s+)?(?:fotografiji|fotografijama|slici|slikama|fotki|fotkama)\\s+(?:je|su)\\s+vidljiv(?:a|e|i|o)?\\s*", RegexOption.IGNORE_CASE) to "",
    Regex("\\bprema\\s+(?:fotografiji|fotografijama|slici|slikama|fotki|fotkama)[,\\s]*", RegexOption.IGNORE_CASE) to "",
    Regex("\\b(?:na\\s+)?(?:fotografiji|fotografijama|slici|slikama|fotki|fotkama)[,\\s]*", RegexOption.IGNORE_CASE) to "",
    Regex("\\s+vidljiv(?:a|e|i|o)?\\s+je\\.?$", RegexOption.IGNORE_CASE) to ".",
    Regex("\\s+(?:je\\s+)?vidljiv(?:a|e|i|o)?\\.?$", RegexOption.IGNORE_CASE) to ".",
    Regex("\\s+se\\s+vidi\\.?$", RegexOption.IGNORE_CASE) to ".",
)

private fun isRoAssessmentUnverifiedNote(value: String): Boolean =
    RO_ASSESSMENT_UNVERIFIED_NOTE_REGEX.containsMatchIn(value.trim())

fun WorkOrderDocumentationDraft.toDocumentationJsonPayload(
    async: Boolean = true,
    draftOnly: Boolean = false,
): String {
    val inspectorIds = JSONArray()
    inspectorUserIds.forEach { inspectorIds.put(it) }
    val electricalInspectorIds = JSONArray()
    electricalInspectorUserIds.forEach { electricalInspectorIds.put(it) }
    val tipkaloInspectorIds = JSONArray()
    tipkaloInspectorUserIds.forEach { tipkaloInspectorIds.put(it) }
    val workEquipmentInspectorIds = JSONArray()
    workEquipmentInspectorUserIds.forEach { workEquipmentInspectorIds.put(it) }
    val workEnvironmentInspectorIds = JSONArray()
    workEnvironmentInspectorUserIds.forEach { workEnvironmentInspectorIds.put(it) }
    val selectedEquipmentIds = JSONArray()
    this.selectedEquipmentIds.forEach { selectedEquipmentIds.put(it) }
    val selectedLegalFrameworkIds = JSONArray()
    this.selectedLegalFrameworkIds.forEach { selectedLegalFrameworkIds.put(it) }
    val selectedRulebookIds = JSONArray()
    this.selectedRulebookIds.forEach { selectedRulebookIds.put(it) }
    val selectedWorkEquipmentRecords = JSONArray()
    this.selectedWorkEquipmentRecords.forEach { selectedWorkEquipmentRecords.put(it.toJsonObject()) }
    val selectedWorkEnvironmentRecords = JSONArray()
    this.selectedWorkEnvironmentRecords.forEach { selectedWorkEnvironmentRecords.put(it.toJsonObject()) }
    val manualWorkEquipments = JSONArray()
    this.manualWorkEquipments.forEach { manualWorkEquipments.put(it.toJsonObject()) }
    val executors = JSONArray()
    this.executors.forEach { executors.put(it) }
    val additionalRecords = JSONArray()
    this.additionalRecords.forEach { record ->
        additionalRecords.put(
            JSONObject()
                .put("serviceKey", record.serviceKey)
                .put("serviceIndex", record.serviceIndex)
                .put("serviceCode", record.serviceCode)
                .put("serviceName", record.serviceName)
                .put("objectId", record.objectId)
                .put("objectName", record.objectName)
                .put("objectSequence", record.objectSequence),
        )
    }
    return JSONObject()
        .put("objectId", objectId)
        .put("objectName", objectName)
        .put("inspectionDate", inspectionDate)
        .put("issuedDate", issuedDate)
        .put("issuedPlace", issuedPlace)
        .put("testingLocation", testingLocation)
        .put("note", note)
        .put("inspectionType", inspectionType)
        .put("completedBy", completedBy)
        .put("outsideTemperature", outsideTemperature)
        .put("relativeHumidity", relativeHumidity)
        .put("airflowSpeed", airflowSpeed)
        .put("weather", weather)
        .put("groundCondition", groundCondition)
        .put("groundResistance", groundResistance)
        .put("measurementEquipmentGroup", measurementEquipmentGroup)
        .put("selectedEquipmentIds", selectedEquipmentIds)
        .put("selectedLegalFrameworkIds", selectedLegalFrameworkIds)
        .put("selectedRulebookIds", selectedRulebookIds)
        .put("selectedWorkEquipmentRecords", selectedWorkEquipmentRecords)
        .put("selectedWorkEnvironmentRecords", selectedWorkEnvironmentRecords)
        .put("manualWorkEquipments", manualWorkEquipments)
        .put("workEquipmentSubmitResult", workEquipmentSubmitResult.toJsonObject())
        .put("workEnvironmentSubmitResult", workEnvironmentSubmitResult.toJsonObject())
        .put("signatureMode", signatureMode)
        .put("validityMonths", validityMonths)
        .put("electricalValidityMonths", electricalValidityMonths)
        .put("tipkaloValidityMonths", tipkaloValidityMonths)
        .put("serviceValidityMonths", serviceValidityMonths.toJsonObject())
        .put("executors", executors)
        .put("inspectorUserIds", inspectorIds)
        .put("inspectorUserId", inspectorUserId)
        .put("authorizationHolderUserId", authorizationHolderUserId)
        .put("electricalInspectorUserIds", electricalInspectorIds)
        .put("electricalInspectorUserId", electricalInspectorUserId)
        .put("electricalAuthorizationHolderUserId", electricalAuthorizationHolderUserId)
        .put("tipkaloInspectorUserIds", tipkaloInspectorIds)
        .put("tipkaloInspectorUserId", tipkaloInspectorUserId)
        .put("tipkaloAuthorizationHolderUserId", tipkaloAuthorizationHolderUserId)
        .put("radna_opremaInspectorUserIds", workEquipmentInspectorIds)
        .put("radna_opremaInspectorUserId", workEquipmentInspectorUserId)
        .put("radna_opremaAuthorizationHolderUserId", workEquipmentAuthorizationHolderUserId)
        .put("radni_okolisInspectorUserIds", workEnvironmentInspectorIds)
        .put("radni_okolisInspectorUserId", workEnvironmentInspectorUserId)
        .put("radni_okolisAuthorizationHolderUserId", workEnvironmentAuthorizationHolderUserId)
        .put("handoverVerifierUserId", handoverVerifierUserId)
        .put("fieldValues", fieldValues.toJsonObject())
        .put("templateFieldValues", templateFieldValues.toNestedJsonObject())
        .put("fieldSheets", fieldSheets.toMeasurementSheetJsonObject())
        .put("templateFieldSheets", templateFieldSheets.toNestedMeasurementSheetJsonObject())
        .put("includedMeasurementTableKeys", JSONArray(includedMeasurementTableKeys.map { it.trim() }.filter { it.isNotBlank() }))
        .put("attachments", attachments.toDocumentationAiFilesJsonArray())
        .put("templateAttachments", templateAttachments.toNestedDocumentationAiFilesJsonObject())
        .put("additionalRecords", additionalRecords)
        .put("includeHandoverProtocol", includeHandoverProtocol)
        .put("async", async)
        .put("draftOnly", draftOnly)
        .toString()
}

class SafeNexusApi(
    private val baseUrl: String = BuildConfig.SAFE_NEXUS_BASE_URL.trimEnd('/'),
) {
    private var authCookieHeader: String = ""
    private var accessToken: String = ""

    private companion object {
        const val DEFAULT_CONNECT_TIMEOUT_MS = 18_000
        const val DEFAULT_READ_TIMEOUT_MS = 24_000
        const val PDF_ACTION_READ_TIMEOUT_MS = 120_000
        const val DOCUMENT_GENERATION_READ_TIMEOUT_MS = 180_000
        const val OPENAI_PREPARE_READ_TIMEOUT_MS = 180_000
        const val DOCUMENT_GENERATION_POLL_INTERVAL_MS = 2_000L
        const val DOCUMENT_GENERATION_POLL_ATTEMPTS = 180
        const val WORK_EQUIPMENT_RECOGNITION_TEMPLATE = "template"
        const val WORK_EQUIPMENT_RECOGNITION_DETAILED = "detailed"
    }

    private fun workEquipmentRoRegisterGroupsJson(): JSONArray =
        JSONArray()
            .put(workEquipmentRoRegisterGroupJson("ro_mechanical_engineering_registers", "Strojarski dio", workEquipmentRoMechanicalRegisterItems(), "mechanical"))
            .put(workEquipmentRoRegisterGroupJson("ro_electrical_registers", "Elektro dio", workEquipmentRoElectricalRegisterItems(), "electrical"))
            .put(workEquipmentRoRegisterGroupJson("hazard_registers", "Opasnosti", workEquipmentRoHazardRegisterItems(), "hazard"))
            .put(workEquipmentRoRegisterGroupJson("harmfulness_registers", "Stetnosti", workEquipmentRoHarmfulnessRegisterItems(), "harmfulness"))
            .put(workEquipmentRoRegisterGroupJson("strain_registers", "Napori", workEquipmentRoStrainRegisterItems(), "strain"))

    private fun workEquipmentRoProfilesJson(): JSONArray =
        JSONArray()
            .put(workEquipmentRoProfileJson(
                id = "ro-ai-profile-forklift",
                name = "Vilicar",
                aliases = listOf("vilicar", "forklift", "linde", "jungheinrich", "still", "toyota"),
                instruction = "Prepoznaj vilicar prema vilicama, jarbolu, kabini/zastitnom krovu, kotacima, upravljacu, bateriji ili motoru. Obavezno gledaj stabilnost, kocnice, vilice, jarbol, hidrauliku, upravljanje, signalizaciju i dokumentaciju.",
                noteExamples = listOf("Ukljucivanje je izvedeno kljucem.", "Upravljanje je pomocu volana i rucica.", "Hidraulicni sustav nema vidljivog curenja."),
                verificationQuestions = listOf("Jesu li kocnice i signalizacija funkcionalno provjerene?", "Jesu li vilice i jarbol bez vidljivih ostecenja?"),
            ))
            .put(workEquipmentRoProfileJson(
                id = "ro-ai-profile-lathe",
                name = "Tokarilica",
                aliases = listOf("tokarilica", "tokarski stroj", "lathe", "cnc tokarski"),
                instruction = "Prepoznaj tokarilicu prema steznoj glavi, suportu, vodilicama, zastitnom pokrovu i upravljackoj ploci. Gledaj rotirajuce dijelove, zastitu od izbacivanja obratka, STOP, upravljanje, buku i dokumentaciju.",
                noteExamples = listOf("Stezna glava je zasticena pokrovom.", "Upravljanje je izvedeno preko upravljacke ploce.", "Radni prostor je pregledan bez vidljivih prepreka."),
                verificationQuestions = listOf("Je li zastitni pokrov stezne glave funkcionalno provjeren?", "Kako se pokrece i zaustavlja vreteno?"),
            ))
            .put(workEquipmentRoProfileJson(
                id = "ro-ai-profile-press",
                name = "Presa",
                aliases = listOf("presa", "hidraulicna presa", "pneumatska presa", "press"),
                instruction = "Prepoznaj presu prema radnom hodu, cilindru, radnom stolu, alatu, dvorucnom upravljanju ili zastitnoj ogradi. Gledaj ukljestenje, STOP, hidrauliku/pneumatiku, tlak i probno opterecenje.",
                noteExamples = listOf("Upravljanje je dvorucno i dostupno rukovatelju.", "Radni prostor je zasticen od ukljestenja.", "Nema vidljivog curenja hidraulicnog medija."),
                verificationQuestions = listOf("Je li dvorucno upravljanje funkcionalno provjereno?", "Je li STOP / hitno zaustavljanje funkcionalno provjereno?"),
            ))
            .put(workEquipmentRoProfileJson(
                id = "ro-ai-profile-compressor",
                name = "Kompresor",
                aliases = listOf("kompresor", "compressor", "atlas copco", "kaeser", "boge"),
                instruction = "Prepoznaj kompresor prema spremniku, manometru, sigurnosnom ventilu, motoru, kucistu i tlacnim vodovima. Gledaj tlak, curenje, buku, vibracije, ventilaciju, prikljucak i dokumentaciju.",
                noteExamples = listOf("Manometar i sigurnosni elementi su dostupni.", "Nema vidljivog curenja zraka ili ulja.", "Kompresor je stabilno postavljen na podlozi."),
                verificationQuestions = listOf("Je li sigurnosni ventil funkcionalno provjeren?", "Koji je radni tlak ili tlak na manometru?"),
            ))
            .put(workEquipmentRoProfileJson(
                id = "ro-ai-profile-pressure-tank-lpg",
                name = "Spremnik / tlacna posuda / UNP oprema",
                aliases = listOf("spremnik", "tlacna posuda", "tlačna posuda", "rezervoar", "unp", "lpg", "propan", "butan", "plin", "plinski spremnik"),
                instruction = "Prepoznaj spremnik, tlacnu posudu ili UNP opremu prema cilindricnom spremniku, armaturi, ventilima, manometru, reduktoru, cjevovodu, oznakama UNP/LPG/propan/butan i zastitnoj ogradi. U radne tvari ne pisi opis slike nego direktno 'Radna tvar: UNP.' kada je vidljiv ili vjerojatan UNP/LPG. Obavezno gledaj strojarski dio, elektro dio ako postoji napajanje ili uzemljenje, opasnost od pozara/eksplozije, kemijske stetnosti i statodinamicke napore.",
                noteExamples = listOf("Radna tvar: UNP.", "Armatura spremnika je dostupna za pregled.", "Nisu uoceni vidljivi tragovi curenja na prikljucnim elementima."),
                verificationQuestions = listOf("Je li dokumentacijom potvrden radni tlak i periodicki pregled spremnika?", "Jesu li sigurnosni ventili i uzemljenje funkcionalno provjereni?"),
            ))
            .put(workEquipmentRoProfileJson(
                id = "ro-ai-profile-analyzer",
                name = "Analizator / servisni aparat",
                aliases = listOf("analizator", "servisni aparat", "bosch bea", "bea750", "bea 750"),
                instruction = "Prepoznaj servisne aparate i analizatore prema kucistu, zaslonu, tipkovnici, sondama, prikljuccima, kotacima i natpisnoj plocici. Za BOSCH BEA prepisuj proizvodaca, tip, serijski broj i naponske podatke.",
                noteExamples = listOf("Upravljanje je izvedeno putem zaslona i tipkovnice.", "Prikljucne sonde su dostupne i bez vidljivih ostecenja.", "Kabel i prikljucak napajanja su pregledani."),
                verificationQuestions = listOf("Je li aparat funkcionalno pokrenut?", "Jesu li sonde i prikljucci neosteceni?"),
            ))
            .put(workEquipmentRoProfileJson(
                id = "ro-ai-profile-crane",
                name = "Dizalica / podizna oprema",
                aliases = listOf("dizalica", "kran", "vitlo", "lancana dizalica", "podizna oprema"),
                instruction = "Prepoznaj dizalice prema kuki, lancu/uzetu, nosivosti, vitlu, nosacu i komandama. Gledaj nosivost, kocnicu, ogranicivace, STOP, deformacije i probno staticko/dinamicko ispitivanje.",
                noteExamples = listOf("Kuka i nosivi elementi su vizualno pregledani.", "Upravljanje dizalicom je jasno oznaceno.", "Probno opterecenje je potvrdeno dokumentacijom."),
                verificationQuestions = listOf("Je li probno opterecenje potvrdeno dokumentacijom ili ispitivanjem?", "Je li upravljanje i kocenje funkcionalno provjereno?"),
            ))
            .put(workEquipmentRoProfileJson(
                id = "ro-ai-profile-column-car-lift",
                name = "Stupna autodizalica",
                aliases = listOf("stupna autodizalica", "dvostupna autodizalica", "cetverostupna autodizalica", "auto dizalica stupna", "autodizalica stupna", "kolonska dizalica", "two post lift", "four post lift", "column lift"),
                instruction = "Prepoznaj stupnu autodizalicu prema stupovima, nosivim rukama, platformama, komandnoj kutiji, oznaci nosivosti i sigurnosnim blokadama. Tretiraj je kao opremu za podizanje vozila, ne kao opcu dizalicu.",
                noteExamples = listOf("Nosive ruke imaju osigurace polozaja.", "Komande podizanja i spustanja su jasno oznacene.", "Hidraulicni sustav nema vidljivog curenja."),
                verificationQuestions = listOf("Jesu li sigurnosne blokade i osiguraci funkcionalno provjereni?", "Koja je nosivost autodizalice s natpisne plocice?"),
                fieldDefaults = workEquipmentRoFieldDefaultsJson(
                    purposeDescription = "Radna oprema se koristi za podizanje vozila pri servisiranju, pregledu i odrzavanju.",
                    workspacePosition = "Autodizalica je postavljena u servisnom prostoru na cvrstoj i ravnoj podlozi.",
                    useAndMaintenance = "Provjeriti nosive ruke/platforme, osigurace, blokade, komande, STOP, hidrauliku/prijenos, sidrenje stupova i upute proizvodaca.",
                    methodsProceduresAndNorms = "Pregled prema propisima za radnu opremu, uputama proizvodaca i pravilima za opremu za podizanje vozila.",
                ),
                registerDefaults = workEquipmentRoRegisterDefaultsJson(
                    mechanical = listOf(1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 21, 23, 24, 25, 26, 27, 29, 30, 31, 34, 35, 36),
                    electrical = listOf(1, 2, 3, 4, 17, 18, 19, 25),
                    hazards = listOf(1, 2, 3),
                    harmfulnesses = listOf(3),
                    strains = listOf(1, 2),
                ),
                registerInstructions = workEquipmentRoRegisterInstructionsJson(
                    workEquipmentRoRegisterIri("ro_mechanical_engineering_registers", 2) to "Upisi stanje podloge, sidrenja i stabilnosti stupova.",
                    workEquipmentRoRegisterIri("ro_mechanical_engineering_registers", 7) to "Opisi komande podizanja i spustanja.",
                    workEquipmentRoRegisterIri("ro_mechanical_engineering_registers", 12) to "Opisi sigurnosne blokade, zasune i osigurace nosivih ruku/platformi.",
                    workEquipmentRoRegisterIri("ro_mechanical_engineering_registers", 19) to "Opisi nosivu konstrukciju, ruke/platforme i vidljive deformacije.",
                    workEquipmentRoRegisterIri("ro_mechanical_engineering_registers", 31) to "Prepisi ili navedi nosivost s plocice ako je vidljiva.",
                    workEquipmentRoRegisterIri("ro_mechanical_engineering_registers", 34) to "Opisi hidraulicni sustav ili prijenos podizanja i eventualno curenje.",
                    workEquipmentRoRegisterIri("ro_electrical_registers", 1) to "Prepisi napon i nacin prikljucka ako je vidljiv.",
                    workEquipmentRoRegisterIri("ro_electrical_registers", 2) to "Opisi prikljucni kabel i izolaciju samo ako su vidljivi.",
                ),
            ))
            .put(workEquipmentRoProfileJson(
                id = "ro-ai-profile-scissor-car-lift",
                name = "Skarasta autodizalica",
                aliases = listOf("skarasta autodizalica", "skare autodizalica", "auto dizalica skarasta", "autodizalica skarasta", "scissor lift", "vehicle scissor lift"),
                instruction = "Prepoznaj skarastu autodizalicu prema skarastom mehanizmu, platformi, niskoprofilnim rampama, hidraulicnim cilindrima, komandama i sigurnosnim blokadama. Tretiraj je kao opremu za podizanje vozila.",
                noteExamples = listOf("Skarasti mehanizam je vizualno pregledan.", "Platforme su stabilne i bez vidljivih deformacija.", "Hidraulicni cilindri nemaju vidljivog curenja."),
                verificationQuestions = listOf("Jesu li platforme i sigurnosne blokade funkcionalno provjerene?", "Je li spustanje izvedeno kontrolirano i bez zapinjanja?"),
                fieldDefaults = workEquipmentRoFieldDefaultsJson(
                    purposeDescription = "Radna oprema se koristi za podizanje vozila na servisnu visinu radi pregleda, servisa i odrzavanja.",
                    workspacePosition = "Skarasta autodizalica je smjestena u servisnom prostoru na ravnoj i nosivoj podlozi.",
                    useAndMaintenance = "Provjeriti platforme, skarasti mehanizam, osovine, hidraulicne cilindre, sigurnosne blokade, komande, STOP i upute proizvodaca.",
                    methodsProceduresAndNorms = "Pregled prema propisima za radnu opremu, uputama proizvodaca i pravilima za opremu za podizanje vozila.",
                ),
                registerDefaults = workEquipmentRoRegisterDefaultsJson(
                    mechanical = listOf(1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 21, 23, 24, 25, 26, 27, 29, 30, 31, 34, 35, 36),
                    electrical = listOf(1, 2, 3, 4, 17, 18, 19, 25),
                    hazards = listOf(1, 2, 3),
                    harmfulnesses = listOf(3),
                    strains = listOf(1, 2),
                ),
                registerInstructions = workEquipmentRoRegisterInstructionsJson(
                    workEquipmentRoRegisterIri("ro_mechanical_engineering_registers", 2) to "Opisi stabilnost i smjestaj platforme na podlozi.",
                    workEquipmentRoRegisterIri("ro_mechanical_engineering_registers", 3) to "Opisi zastitu od skarastog mehanizma i ukljestenja ako je vidljiva.",
                    workEquipmentRoRegisterIri("ro_mechanical_engineering_registers", 7) to "Opisi komande podizanja/spustanja i nacin ukljucivanja.",
                    workEquipmentRoRegisterIri("ro_mechanical_engineering_registers", 12) to "Opisi sigurnosne blokade, zube, zasune i osiguranje od nekontroliranog spustanja.",
                    workEquipmentRoRegisterIri("ro_mechanical_engineering_registers", 19) to "Opisi platforme, skaraste krakove i vidljive deformacije.",
                    workEquipmentRoRegisterIri("ro_mechanical_engineering_registers", 31) to "Prepisi nosivost s plocice ako je vidljiva ili trazi potvrdu korisnika.",
                    workEquipmentRoRegisterIri("ro_mechanical_engineering_registers", 34) to "Opisi hidraulicne cilindre, crijeva i vidljivo curenje.",
                    workEquipmentRoRegisterIri("ro_electrical_registers", 1) to "Prepisi napon i nacin prikljucka ako je vidljiv.",
                    workEquipmentRoRegisterIri("ro_electrical_registers", 2) to "Opisi prikljucni kabel, izolaciju i vidljivo stanje prikljucka.",
                ),
            ))
            .put(workEquipmentRoProfileJson(
                id = "ro-ai-profile-saw-grinder",
                name = "Pila / brusilica",
                aliases = listOf("pila", "kruzna pila", "tracna pila", "brusilica", "rezalica", "grinder"),
                instruction = "Prepoznaj pile i brusilice prema disku, traci, brusnom kolu, stitniku, radnom stolu i vodilici. Gledaj zastitu radnih elemenata, izbacivanje cestica, STOP, prasinu, buku i vibracije.",
                noteExamples = listOf("Radni element je zasticen pokrovom.", "Upravljanje i STOP su dostupni rukovatelju.", "Potrebno je koristiti propisanu osobnu zastitnu opremu."),
                verificationQuestions = listOf("Je li zastitni pokrov radnog elementa na mjestu?", "Je li STOP / iskljucivanje funkcionalno provjereno?"),
            ))

    private fun workEquipmentRoFieldDefaultsJson(
        technicalData: String = "",
        purposeDescription: String = "",
        workspacePosition: String = "",
        useAndMaintenance: String = "",
        methodsProceduresAndNorms: String = "",
    ): JSONObject =
        JSONObject()
            .put("technicalData", technicalData)
            .put("purposeDescription", purposeDescription)
            .put("workspacePosition", workspacePosition)
            .put("useAndMaintenance", useAndMaintenance)
            .put("methodsProceduresAndNorms", methodsProceduresAndNorms)

    private fun workEquipmentRoRegisterDefaultsJson(
        mechanical: List<Int> = emptyList(),
        electrical: List<Int> = emptyList(),
        hazards: List<Int> = emptyList(),
        harmfulnesses: List<Int> = emptyList(),
        strains: List<Int> = emptyList(),
    ): JSONObject =
        JSONObject()
            .put("mechanical", workEquipmentRoRegisterIrisJson("ro_mechanical_engineering_registers", mechanical))
            .put("electrical", workEquipmentRoRegisterIrisJson("ro_electrical_registers", electrical))
            .put("hazards", workEquipmentRoRegisterIrisJson("hazard_registers", hazards))
            .put("harmfulnesses", workEquipmentRoRegisterIrisJson("harmfulness_registers", harmfulnesses))
            .put("strains", workEquipmentRoRegisterIrisJson("strain_registers", strains))

    private fun workEquipmentRoRegisterIrisJson(path: String, ids: List<Int>): JSONArray =
        JSONArray(ids.map { id -> workEquipmentRoRegisterIri(path, id) })

    private fun workEquipmentRoRegisterIri(path: String, id: Int): String =
        "/api/v3/$path/$id"

    private fun workEquipmentRoRegisterInstructionsJson(vararg entries: Pair<String, String>): JSONObject {
        val json = JSONObject()
        entries.forEach { (key, value) ->
            if (key.isNotBlank() && value.isNotBlank()) {
                json.put(key, value)
            }
        }
        return json
    }

    private fun workEquipmentRoProfileJson(
        id: String,
        name: String,
        aliases: List<String>,
        instruction: String,
        noteExamples: List<String>,
        verificationQuestions: List<String> = emptyList(),
        fieldDefaults: JSONObject = JSONObject(),
        registerDefaults: JSONObject = JSONObject(),
        registerInstructions: JSONObject = JSONObject(),
    ): JSONObject =
        JSONObject()
            .put("id", id)
            .put("name", name)
            .put("aliases", JSONArray(aliases))
            .put("generalInstruction", instruction)
            .put("noteRule", "Napomena/vrijednost nije uvjet za rucni unos ni IS ZNR slanje, ali NexAI ne treba vracati prazne strojarske ili elektro stavke. Kada ima siguran izvor, upisi konkretan customContent do $RO_ASSESSMENT_NOTE_MAX_LENGTH znakova. U customContent ne pisati 'treba provjeriti/potvrditi' niti 'vidi se na fotografiji/slici'; to ide u verificationQuestions ili se pise kao direktan nalaz.")
            .put("noteExamples", JSONArray(noteExamples))
            .put("verificationQuestions", JSONArray(verificationQuestions))
            .put("fieldDefaults", fieldDefaults)
            .put("registerDefaults", registerDefaults)
            .put("registerInstructions", registerInstructions)

    private fun normalizeWorkEquipmentRecognitionMode(value: String): String =
        when (value.trim().lowercase(Locale.getDefault())) {
            "template", "profile", "profil", "fast", "quick", "brzo" -> WORK_EQUIPMENT_RECOGNITION_TEMPLATE
            else -> WORK_EQUIPMENT_RECOGNITION_DETAILED
        }

    private fun workEquipmentRoTemplateAssessmentRule(batchMode: Boolean): String =
        listOf(
            "BRZI TEMPLATE NACIN: korisnik zeli AI preko templatea/profila. Ne radi puni tehnicki pregled kao u detaljnom nacinu.",
            "Primarni zadatak je: 1) prepoznati najblizi profileId/profileName iz context.profiles, 2) procitati natpisnu plocicu i osnovne oznake, 3) popuniti samo stavke koje dolaze iz prepoznatog/odabranog templatea ili su direktno procitane sa slika.",
            "Ako context.selectedProfileId ili selectedProfileName postoji, taj profil ima prednost osim ako slike jasno prikazuju drugu opremu; tada vrati pitanje u verificationQuestions.",
            "Obavezno vrati profileId i profileName za svaki workEquipments zapis. Ako nisi siguran, vrati najblizi profil i confidence=low, ali ne izmisljaj siroke nalaze.",
            "Natpisna plocica ima prioritet za manufacturer, model, serialNumber, inventoryNumber i technicalData. Fotografija cijelog stroja sluzi za naziv, profil i osnovnu namjenu.",
            "Opisna polja popuni kratko iz templatea i jasnih dokaza: namjena, polozaj, radna tvar, uporaba/odrzavanje, metode. Za UNP pisi 'Radna tvar: UNP.', za kompresor 'Radni medij: stlaceni zrak.'.",
            "mechanicalItems/electricalItems vrati samo za stavke iz profila/templatea ili za izravno vidljive podatke. Ne ciljaj 12 stavki i ne popunjavaj opce stavke samo zato sto postoje u registru.",
            "Ako profil ima fieldDefaults, registerDefaults ili registerInstructions, koristi ih kao template. Ako ih nema, koristi samo generalInstruction/noteExamples profila i ono sto je jasno s plocice/slika.",
            "Nedostatke i mjere formuliraj blago. Ako nije jasno, pisi 'Bez vidljivih nedostataka na dostavljenim slikama.' i 'Nisu potrebne posebne mjere prema dostavljenim slikama.'.",
            "U customContent ne pisi 'treba provjeriti', 'treba potvrditi', 'na slici se vidi' ni slicno. Nesigurne stvari stavi u verificationQuestions.",
            if (batchMode) {
                "Za batch zadrzi kronolosko grupiranje slika i za svaku opremu vrati zaseban workEquipments zapis s imageIndexes/sourceImageNames."
            } else {
                "Za single upload vrati samo workEquipments[0] za trenutno otvorenu kolonu."
            },
        ).joinToString(" ")

    private fun workEquipmentRoRegisterGroupJson(
        path: String,
        label: String,
        items: List<Pair<String, String>>,
        kind: String,
    ): JSONObject =
        JSONObject()
            .put("path", path)
            .put("label", label)
            .put("items", JSONArray(items.map { (id, itemLabel) ->
                JSONObject()
                    .put("id", id)
                    .put("iri", "/api/v3/$path/$id")
                    .put("label", itemLabel)
                    .put("aiInstruction", workEquipmentRoRegisterInstruction(kind, itemLabel))
            }))

    private fun workEquipmentRoRegisterInstruction(kind: String, label: String): JSONObject {
        val normalized = label
            .lowercase(Locale.ROOT)
            .replace("č", "c")
            .replace("ć", "c")
            .replace("š", "s")
            .replace("ž", "z")
            .replace("đ", "d")

        if (kind == "hazard") {
            return JSONObject()
                .put("instruction", "Ako je '$label' relevantno za prepoznatu radnu opremu, vrati puni IRI iz hazard_registers. Ne pisi opceniti opis fotografije. Primjeri: mehanicke opasnosti za pokretne dijelove i radne elemente, elektricna struja za elektricnu opremu, pozar i eksplozija za UNP/LPG/gorivo/plin/tlacnu opremu, termicke opasnosti za vruce/hladne dijelove.")
                .put("mustInclude", "hazardRegisterIris samo za opasnosti koje proizlaze iz stroja, radne tvari, nacina rada ili okruzenja")
                .put("avoid", "Ne izmisljaj opasnost ako se ne moze zakljuciti iz slike, plocice ili vrste opreme.")
                .put("confidenceRequired", "medium")
        }
        if (kind == "harmfulness") {
            return JSONObject()
                .put("instruction", "Ako je '$label' relevantno za prepoznatu radnu opremu, vrati puni IRI iz harmfulness_registers. Kemijske stetnosti koristi za UNP/LPG, gorivo, ulje, ispusne plinove, prasinu ili kemikalije. Fizikalne stetnosti koristi za buku, vibracije, toplinu, hladnocu ili zracenje kada proizlaze iz opreme.")
                .put("mustInclude", "harmfulnessRegisterIris za stvarne stetnosti koje proizlaze iz radne tvari ili rada opreme")
                .put("avoid", "Ne pisi 'na slici se vidi'; ne dodavati bioloske stetnosti bez jasnog izvora.")
                .put("confidenceRequired", "medium")
        }
        if (kind == "strain") {
            return JSONObject()
                .put("instruction", "Ako je '$label' relevantno za prepoznatu radnu opremu, vrati puni IRI iz strain_registers. Statodinamicke napore koristi za guranje, vucu, podizanje, dugotrajno stajanje ili rad u prisilnom polozaju. Napori vida vrijede za zaslone, sitne oznake ili precizan vizualni nadzor.")
                .put("mustInclude", "strainRegisterIris za napore koji proizlaze iz nacina uporabe opreme")
                .put("avoid", "Ne dodavati napore govora ili vida bez vidljivog ili logicnog razloga.")
                .put("confidenceRequired", "medium")
        }

        val details = when {
            normalized.contains("stabil") || normalized.contains("postavljanja") ->
                "Provjeri stabilnost, oslonce, podlogu, kotace, kocnice i osiguranje od pomicanja ili prevrtanja."
            normalized.contains("pokretnih") || normalized.contains("prijenosnici") || normalized.contains("radni elementi") ->
                "Provjeri vidljive pokretne dijelove, zastitne poklopce, prijenosnike snage, radne elemente i rizik zahvata."
            normalized.contains("upravlj") || normalized.contains("ukljuc") || normalized.contains("iskljuc") || normalized.contains("signal") ->
                "Provjeri tipkala, sklopke, STOP, oznake smjera, signalizaciju i dostupnost upravljanja."
            normalized.contains("zastitnih naprava") || normalized.contains("neocekivanog") || normalized.contains("neovlastenog") ->
                "Provjeri zastitne naprave, blokade, pokrove, ograde, brave i mjere koje sprjecavaju opasan pristup ili neocekivano pokretanje."
            normalized.contains("dokument") || normalized.contains("uputama") || normalized.contains("znakovima") || normalized.contains("oznac") ->
                "Provjeri vidljive sigurnosne oznake, upozorenja, upute, servisnu ili tehnicku dokumentaciju."
            normalized.contains("tlac") || normalized.contains("hidraulic") || normalized.contains("plin") || normalized.contains("tekuc") || normalized.contains("pozar") || normalized.contains("eksploz") ->
                "Provjeri medij, tlak, hidrauliku, plin, gorivo, curenje, ventilaciju, izvore paljenja i sigurnosne elemente."
            normalized.contains("buke") || normalized.contains("vibracija") ->
                "Provjeri motorne dijelove, kompresorski rad, ucvrscenje, izolaciju buke/vibracija i potrebu za mjerenjem."
            normalized.contains("opterec") || normalized.contains("deform") || normalized.contains("statick") || normalized.contains("dinamick") ->
                "Provjeri nosive dijelove, konstrukciju, probno opterecenje, pukotine, deformacije i sigurnost pri teretu."
            normalized.contains("kabela") || normalized.contains("prikljuc") || normalized.contains("izolacije") ->
                "Provjeri kabel, utikac, prikljucne naprave, uvodnice, napon s plocice i stanje izolacije."
            normalized.contains("rcd") || normalized.contains("impedancija") || normalized.contains("otpor") || normalized.contains("napon dodira") || normalized.contains("struja") ->
                "Koristi samo uz mjerne rezultate ili dokumentaciju; navedi izmjerenu i dopustenu vrijednost ako postoje."
            normalized.contains("kratkog spoja") || normalized.contains("preopterecenja") || normalized.contains("povrata napona") ->
                "Provjeri osigurace, prekidace, zastitne elemente i funkciju zastite od kratkog spoja, preopterecenja ili povrata napona."
            normalized.contains("static") || normalized.contains("munja") || normalized.contains("zracenja") || normalized.contains("posebnih propisa") ->
                "Predlozi samo za posebne elektricne rizike koji su vidljivi ili dokumentirani: statika, munja, zracenje, EX ili posebna oprema."
            else ->
                if (kind == "electrical") {
                    "Predlozi samo kada fotografija, plocica, mjerenje ili dokument jasno pokazuju da je elektro stavka relevantna."
                } else {
                    "Predlozi samo kada fotografija, plocica, dokument ili vidljivo stanje opreme jasno pokazuju da je strojarska stavka relevantna."
                }
        }

        return JSONObject()
            .put("instruction", "$details Napomena/vrijednost nije blocker za zapisnik, ali AI preview ne smije vracati prazne stavke. Ako ima siguran izvor, upisi jednu konkretnu napomenu/vrijednost do $RO_ASSESSMENT_NOTE_MAX_LENGTH znakova. measuredValue koristi samo za stvarno mjerenje; customContent neka objasni nalaz kada je podatak poznat. U customContent ne pisati 'treba provjeriti/potvrditi/utvrditi' niti 'vidi se na fotografiji/slici'; nesigurno vrati kao verificationQuestions, a sigurno napisi kao direktan nalaz.")
            .put("mustInclude", "konkretan nalaz, stanje i zakljucak zadovoljava/ne zadovoljava kada postoji siguran izvor")
            .put("avoid", "Ne popunjavati automatski bez jasnog izvora i ne dodavati stavku samo zato sto postoji u sifrarniku.")
            .put("verificationRule", "Ako je potrebna funkcionalna provjera ili odgovor korisnika, nemoj vratiti stavku kao gotov nalaz nego dodaj pitanje u verificationQuestions.")
            .put("textLength", "customContent: 1 kratka konkretna recenica do $RO_ASSESSMENT_NOTE_MAX_LENGTH znakova kada postoji siguran izvor")
            .put("examples", "Ukljucivanje je izvedeno kljucem. / Upravljanje je pomocu rucica i volana. / Prikljucni kabel i utikac su neosteceni.")
            .put("confidenceRequired", if (kind == "electrical") "high" else "medium")
    }

    private fun workEquipmentRoMechanicalRegisterItems(): List<Pair<String, String>> = listOf(
        "1" to "Smještaj i osiguranje slobodnog prostora za neometan pristup, kretanje, rad i održavanje",
        "2" to "Način postavljanja - osiguranje stabilnosti",
        "3" to "Zaštita od pokretnih dijelova",
        "4" to "Zaštita od pokretnih dijelova - prijenosnici snage i gibanja",
        "5" to "Zaštita od pokretnih dijelova - radni elementi",
        "6" to "Zaštita od padajućih ili izbačenih predmeta",
        "7" to "Djelovanje uređaja za uključivanje i isključivanje",
        "8" to "Djelovanje uređaja za isključivanje u slučaju opasnosti",
        "9" to "Upravljačko mjesto",
        "10" to "Djelovanje uređaja za upravljanje",
        "11" to "Ostvarivanje gibanja i djelovanja prema oznakama i smjerovima",
        "12" to "Raspoloživost i ispravnost zaštitnih naprava i uređaja",
        "13" to "Raspoloživost i ispravnost mjernih/kontrolnih uređaja",
        "14" to "Zaštita od neočekivanog pokretanja",
        "15" to "Zaštita od neovlaštenog korištenja",
        "16" to "Zaštita od zatvaranja u opasni prostor",
        "17" to "Opremljenost, označavanje i ispravnost upravljačkih i signalnih elemenata",
        "18" to "Opremljenost znakovima sigurnosti",
        "19" to "Zaštita od propadanja, lomova, deformacija pri statičkom i dinamičkom opterećenju",
        "20" to "Zaštita od vrućih/hladnih dijelova",
        "21" to "Primjena mjera za zaštitu od požara i eksplozije",
        "22" to "Zaštita od opasnih tvari - plinova, tekućina, para, aerosola, prašine",
        "23" to "Sigurnosni elementi tlačne opreme",
        "24" to "Zaštita od buke",
        "25" to "Zaštita od vibracija",
        "26" to "Primjena specifičnih propisa ovisno o primjeni",
        "27" to "Način priključka na odgovarajuće instalacije",
        "28" to "Promjene nastale korištenjem",
        "29" to "Opremljenost odgovarajućim uputama",
        "30" to "Raspoloživost tehničke dokumentacije",
        "31" to "Radno opterećenje na karakterističnim pozicijama radnih elemenata",
        "32" to "Raspoloživost osobne zaštitne opreme",
        "33" to "Odvođenje produkata izgaranja je odgovarajuće",
        "34" to "Mehanizam hidrauličkog sustava osigurava besprijekoran rad",
        "35" to "Probno statičko ispitivanje provedeno je s poznatim pokusnim teretom",
        "36" to "Probno dinamičko ispitivanje provedeno je s poznatim pokusnim teretom",
    )

    private fun workEquipmentRoElectricalRegisterItems(): List<Pair<String, String>> = listOf(
        "1" to "Način priključka na električnu mrežu, nazivni napon",
        "2" to "Vrsta kabela, presjek vodiča, stanje izolacije",
        "3" to "Ispravnost priključnih naprava",
        "4" to "Zaštita od izravnog dodira dijelova pod naponom",
        "5" to "Dopuštena impedancija petlje kvara - Zsdop (Ω)",
        "6" to "Dopušteno vrijeme isključenja - ti (s)",
        "7" to "Nominalna struja nadstrujnog zaštitnog elementa - In (A)",
        "8" to "Izmjerena impedancija petlje kvara - Zs (Ω)",
        "9" to "Nominalna struja RCD - In (A)",
        "10" to "Nominalna diferencijalna struja RCD - Idn (A)",
        "11" to "Dopušteni neizravni napon dodira - Uidop (V)",
        "12" to "Izmjereni napon dodira uz Idn - Ui (V)",
        "13" to "Vrijeme isključenja RCD - ti (ms)",
        "14" to "Izjednačenje potencijala dohvatljivih vodljivih dijelova - Rgv (Ω)",
        "15" to "Zaštita sigurnosno malim naponom",
        "16" to "Oprema klase II (dvostruka izolacija)",
        "17" to "Zaštita od kratkog spoja i preopterećenja",
        "18" to "Otpor izolacije (MΩ)",
        "19" to "Zaštita od nekontroliranog uključenja",
        "20" to "Zaštita od povrata napona",
        "21" to "Zaštita od statičkog elektriciteta",
        "22" to "Zaštita od djelovanja munja (Ω)",
        "23" to "Zaštita od neionizirajućeg zračenja",
        "24" to "Zaštita od ionizirajućeg zračenja",
        "25" to "Primjena posebnih propisa i normi",
        "26" to "Izmjerena diferencijalna struja RCD - Id (A)",
    )

    private fun workEquipmentRoHazardRegisterItems(): List<Pair<String, String>> = listOf(
        "1" to "Mehaničke opasnosti",
        "2" to "Opasnosti od padova",
        "3" to "Električna struja",
        "4" to "Požar i eksplozija",
        "5" to "Termičke opasnosti",
    )

    private fun workEquipmentRoHarmfulnessRegisterItems(): List<Pair<String, String>> = listOf(
        "1" to "Kemijske štetnosti",
        "2" to "Biološke štetnosti",
        "3" to "Fizikalne štetnosti",
    )

    private fun workEquipmentRoStrainRegisterItems(): List<Pair<String, String>> = listOf(
        "1" to "Statodinamički napori",
        "2" to "Psihofiziološki napori",
        "3" to "Napori vida",
        "4" to "Napori govora",
    )

    init {
        if (CookieHandler.getDefault() == null) {
            CookieHandler.setDefault(CookieManager(null, CookiePolicy.ACCEPT_ALL))
        }
    }

    fun restoreSession(storedAccessToken: String, storedCookieHeader: String) {
        accessToken = storedAccessToken.trim()
        authCookieHeader = storedCookieHeader.trim()
    }

    fun clearSession() {
        accessToken = ""
        authCookieHeader = ""
    }

    fun currentAccessToken(): String = accessToken

    fun currentAuthCookieHeader(): String = authCookieHeader

    suspend fun documentationWeatherSuggestion(location: String): Result<DocumentationWeatherSuggestion> = withContext(Dispatchers.IO) {
        runCatching {
            val lookupCity = guessDocumentationWeatherCity(location)
            if (lookupCity.isBlank()) {
                throw IllegalStateException("Lokacija nije dovoljna za dohvat vremena.")
            }
            val encodedCity = URLEncoder.encode(lookupCity, "UTF-8")
            val json = JSONObject(request("/api/weather?city=$encodedCity"))
            val city = json.optJSONArray("cities")?.optJSONObject(0)
                ?: throw IllegalStateException("Vrijeme za lokaciju nije pronađeno.")
            val current = city.optJSONObject("current") ?: JSONObject()
            val condition = current.optString("condition").trim()
            val description = current.optString("description").trim()
            DocumentationWeatherSuggestion(
                city = listOf(city.optString("name").trim(), city.optString("country").trim())
                    .filter { it.isNotBlank() }
                    .joinToString(", "),
                outsideTemperature = current.optFiniteDouble("temp")?.let { formatWeatherDecimal(it, " °C") }.orEmpty(),
                relativeHumidity = current.optFiniteDouble("humidity")?.let { "${it.toInt()} %" }.orEmpty(),
                airflowSpeed = current.optFiniteDouble("windSpeed")?.let { formatWeatherDecimal(it, " m/s") }.orEmpty(),
                weather = description.ifBlank { localizedOpenWeatherCondition(condition) },
                groundCondition = groundConditionFromOpenWeather(condition),
                source = "OpenWeather",
            )
        }
    }

    suspend fun login(email: String, password: String): Result<SafeNexusUser> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("email", email.trim())
                .put("password", password)
                .toString()
            val response = request("/api/auth/login", method = "POST", body = payload)
            val json = JSONObject(response)
            accessToken = json.optString("mobileAccessToken", "").trim()
            json.optJSONObject("user").toSafeNexusUser()
        }
    }

    suspend fun bootstrap(): Result<BootstrapData> = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject(request("/api/mobile/bootstrap"))
            BootstrapData(
                workOrders = json.optJSONArray("workOrders").toWorkOrders(),
                companies = json.optJSONArray("companies").toRecords(),
                locations = json.optJSONArray("locations").toRecords(),
                workOrderStatuses = json.optJSONObject("options")?.optJSONArray("workOrderStatuses").toOptions(),
                priorities = json.optJSONObject("options")?.optJSONArray("priorities").toOptions(),
                reminderStatuses = json.optJSONObject("options")?.optJSONArray("reminderStatuses").toOptions(),
                todoTaskStatuses = json.optJSONObject("options")?.optJSONArray("todoTaskStatuses").toOptions(),
                workOrderCompanies = json.optJSONObject("options")?.optJSONArray("workOrderCompanies").toWorkOrderCompanies(),
                workOrderLocations = json.optJSONObject("options")?.optJSONArray("workOrderLocations").toWorkOrderLocations(),
                workOrderUsers = json.optJSONObject("options")?.optJSONArray("workOrderUsers").toWorkOrderUsers(),
                workOrderServices = json.optJSONObject("options")?.optJSONArray("workOrderServices").toWorkOrderServices(),
                workOrderLocationObjects = json.optJSONObject("options")?.optJSONArray("workOrderLocationObjects").toWorkOrderLocationObjects(),
                vehicles = json.optJSONArray("vehicles").toRecords(),
                measurementEquipmentRecords = json.optJSONArray("measurementEquipmentRecords").toRecords(),
                documentRecords = json.optJSONArray("documentRecords").toRecords(),
                peopleTrainingRecords = json.optJSONArray("peopleTrainingRecords").toRecords(),
                clientPortalRecords = json.optJSONArray("clientPortalRecords").toRecords(),
                rulebooks = json.optJSONArray("rulebooks").toRecords(),
                legalFrameworks = json.optJSONArray("legalFrameworks").toRecords(),
                riskAssessmentRecords = json.optJSONArray("riskAssessmentRecords").toRecords(),
                jobs = json.optJSONArray("jobs").toRecords(),
                offers = json.optJSONArray("offers").toRecords(),
                fieldInquiries = json.optJSONArray("fieldInquiries").toRecords(),
                reminders = json.optJSONArray("reminders").toRecords(),
                todoTasks = json.optJSONArray("todoTasks").toRecords(),
                calendarEvents = json.optJSONArray("calendarEvents").toRecords(),
                dashboard = json.optJSONObject("dashboard").toDashboardStats(),
                clientHome = json.optJSONObject("clientHome").toClientHomeSummary(),
            )
        }
    }

    suspend fun listMobileCompanies(
        query: String = "",
        offset: Int = 0,
        limit: Int = 60,
    ): Result<PagedMobileRecords> = withContext(Dispatchers.IO) {
        runCatching {
            val params = listOf(
                "offset=${offset.coerceAtLeast(0)}",
                "limit=${limit.coerceIn(20, 120)}",
            ) + query.trim().takeIf { it.isNotBlank() }?.let { listOf("q=${it.pathSegment()}") }.orEmpty()
            val json = JSONObject(request("/api/mobile/directory/companies?${params.joinToString("&")}"))
            json.toPagedMobileRecords()
        }
    }

    suspend fun listMobileCompanyLocations(
        companyId: String,
        query: String = "",
        offset: Int = 0,
        limit: Int = 80,
    ): Result<PagedMobileRecords> = withContext(Dispatchers.IO) {
        runCatching {
            val params = listOf(
                "offset=${offset.coerceAtLeast(0)}",
                "limit=${limit.coerceIn(20, 160)}",
            ) + query.trim().takeIf { it.isNotBlank() }?.let { listOf("q=${it.pathSegment()}") }.orEmpty()
            val json = JSONObject(request("/api/mobile/directory/companies/${companyId.pathSegment()}/locations?${params.joinToString("&")}"))
            json.toPagedMobileRecords()
        }
    }

    suspend fun saveClientPortalRecord(draft: ClientPortalRecordDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val path = if (draft.id.isBlank()) {
                "/api/client-portal-records"
            } else {
                "/api/client-portal-records/${draft.id.pathSegment()}"
            }
            val method = if (draft.id.isBlank()) "POST" else "PATCH"
            request(path, method = method, body = draft.toJsonPayload())
            Unit
        }
    }

    suspend fun createWorkOrder(draft: WorkOrderCreateDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val serviceItems = JSONArray()
            draft.serviceIds.forEach { serviceId ->
                serviceItems.put(JSONObject().put("serviceId", serviceId))
            }
            val payload = JSONObject()
                .put("companyId", draft.companyId)
                .put("locationId", draft.locationId)
                .put("status", draft.status)
                .put("openedDate", draft.openedDate)
                .put("dueDate", draft.dueDate)
                .put("executionDate", draft.executionDate)
                .put("priority", draft.priority)
                .put("serviceLine", draft.serviceLine)
                .put("serviceItems", serviceItems)
                .put("description", draft.description)
                .put("executors", JSONArray(draft.executors))
                .put("executor1", draft.executors.getOrNull(0).orEmpty())
                .put("executor2", draft.executors.getOrNull(1).orEmpty())
                .put("completedBy", draft.completedBy)
                .put("teamLabel", draft.teamLabel)
                .put("contactName", draft.contactName)
                .put("contactPhone", draft.contactPhone)
                .put("contactEmail", draft.contactEmail)
                .put("tagText", draft.tagText)
                .put("invoiceNote", draft.invoiceNote)
                .put("linkReference", draft.linkReference)
                .put("department", draft.department)
                .put("sourceFieldInquiryId", draft.sourceFieldInquiryId)
                .toString()
            request("/api/work-orders", method = "POST", body = payload)
            Unit
        }
    }

    suspend fun polishFieldInquiryNote(
        transcript: String,
        currentNote: String,
        title: String,
        companyName: String,
        locationName: String,
        serviceLine: String,
    ): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("transcript", transcript)
                .put("currentNote", currentNote)
                .put("title", title)
                .put("companyName", companyName)
                .put("locationName", locationName)
                .put("serviceLine", serviceLine)
                .toString()
            val json = JSONObject(request("/api/mobile/field-inquiries/polish-note", method = "POST", body = payload))
            json.optString("note", transcript).ifBlank { transcript }
        }
    }

    suspend fun createFieldInquiry(draft: FieldInquiryDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request("/api/mobile/field-inquiries", method = "POST", body = draft.toJsonPayload())
            Unit
        }
    }

    suspend fun createJob(draft: JobCreateDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request("/api/jobs", method = "POST", body = draft.toJsonPayload())
            Unit
        }
    }

    suspend fun createRiskAssessment(draft: RiskAssessmentCreateDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request(
                "/api/risk-assessments",
                method = "POST",
                body = draft.toJsonPayload(),
                readTimeoutMs = 60_000,
            )
            Unit
        }
    }

    suspend fun updateFieldInquiry(draft: FieldInquiryDraft): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request("/api/mobile/field-inquiries/${draft.id.pathSegment()}", method = "PATCH", body = draft.toJsonPayload())
            Unit
        }
    }

    suspend fun convertFieldInquiryToWorkOrder(inquiryId: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request(
                "/api/mobile/field-inquiries/${inquiryId.pathSegment()}/convert-to-work-order",
                method = "POST",
                body = JSONObject().put("syncWorkOrderExecutionDate", true).toString(),
            )
            Unit
        }
    }

    suspend fun createWorkOrderLocation(draft: WorkOrderLocationCreateDraft): Result<WorkOrderLocationOption> = withContext(Dispatchers.IO) {
        runCatching {
            val contacts = JSONArray()
            if (draft.contactName.isNotBlank() || draft.contactPhone.isNotBlank() || draft.contactEmail.isNotBlank()) {
                contacts.put(
                    JSONObject()
                        .put("name", draft.contactName)
                        .put("phone", draft.contactPhone)
                        .put("email", draft.contactEmail),
                )
            }
            val payload = JSONObject()
                .put("companyId", draft.companyId)
                .put("name", draft.name)
                .put("region", draft.region)
                .put("coordinates", draft.coordinates)
                .put("contacts", contacts)
                .put("contactName1", draft.contactName)
                .put("contactPhone1", draft.contactPhone)
                .put("contactEmail1", draft.contactEmail)
                .put("note", draft.note)
                .toString()
            val json = JSONObject(request("/api/mobile/locations", method = "POST", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrderLocationOption()
        }
    }

    suspend fun workOrders(): Result<BootstrapData> = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject(request("/api/mobile/work-orders"))
            BootstrapData(
                workOrders = json.optJSONArray("workOrders").toWorkOrders(),
            )
        }
    }

    suspend fun listIsznrMeasurementEquipment(): Result<List<MobileRecord>> = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject(request("/api/mobile/isznr/instruments", readTimeoutMs = 120_000))
            json.optJSONArray("records").toRecords()
        }
    }

    suspend fun listIsznrWorkEquipment(): Result<List<MobileRecord>> = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject(request("/api/mobile/isznr/work-equipment?maxRecords=200", readTimeoutMs = 90_000))
            json.optJSONArray("records").toRecords()
        }
    }

    suspend fun listIsznrPeople(): Result<List<MobileRecord>> = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject(request("/api/mobile/isznr/people", readTimeoutMs = 60_000))
            json.optJSONArray("records").toRecords()
        }
    }

    suspend fun updateWorkOrderNumber(workOrderId: String, workOrderNumber: String): Result<WorkOrder> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("workOrderNumber", workOrderNumber.trim())
                .toString()
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrder()
        }
    }

    suspend fun updateWorkOrderStatus(workOrderId: String, status: String): Result<WorkOrder> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("status", status)
                .toString()
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrder()
        }
    }

    suspend fun updateWorkOrderDates(workOrderId: String, dueDate: String, executionDate: String): Result<WorkOrder> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("dueDate", dueDate.trim())
                .put("executionDate", executionDate.trim())
                .toString()
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrder()
        }
    }

    suspend fun updateWorkOrderServices(workOrderId: String, serviceIds: List<String>): Result<WorkOrder> = withContext(Dispatchers.IO) {
        runCatching {
            val serviceItems = JSONArray()
            serviceIds.distinct().forEach { serviceId ->
                serviceItems.put(JSONObject().put("serviceId", serviceId))
            }
            val payload = JSONObject()
                .put("serviceItems", serviceItems)
                .toString()
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrder()
        }
    }

    suspend fun updateWorkOrderExecutors(workOrderId: String, executors: List<String>): Result<WorkOrder> = withContext(Dispatchers.IO) {
        runCatching {
            val normalized = executors.map { it.trim() }.filter { it.isNotBlank() }.distinct()
            val payload = JSONObject()
                .put("executors", JSONArray(normalized))
                .put("executor1", normalized.getOrNull(0).orEmpty())
                .put("executor2", normalized.getOrNull(1).orEmpty())
                .toString()
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrder()
        }
    }

    suspend fun updateWorkOrderMeta(workOrderId: String, priority: String, tagText: String): Result<WorkOrder> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("priority", priority.trim())
                .put("tagText", tagText.trim())
                .toString()
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrder()
        }
    }

    suspend fun updateWorkOrderWatchers(workOrderId: String, watcherIds: List<String>): Result<WorkOrder> = withContext(Dispatchers.IO) {
        runCatching {
            val normalized = watcherIds.map { it.trim() }.filter { it.isNotBlank() }.distinct()
            val payload = JSONObject()
                .put("watcherIds", JSONArray(normalized))
                .toString()
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}", method = "PATCH", body = payload))
            (json.optJSONObject("item") ?: JSONObject()).toWorkOrder()
        }
    }

    suspend fun createReminder(
        title: String,
        note: String,
        dueDate: String,
        status: String,
        repeatEveryDays: String,
        workOrderId: String,
        companyId: String,
        locationId: String,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("title", title.trim())
                .put("note", note.trim())
                .put("dueDate", dueDate.trim())
                .put("status", status.trim().ifBlank { "active" })
                .put("repeatEveryDays", repeatEveryDays.trim())
                .put("workOrderId", workOrderId.trim())
                .put("companyId", companyId.trim())
                .put("locationId", locationId.trim())
                .toString()
            request("/api/reminders", method = "POST", body = payload)
            Unit
        }
    }

    suspend fun updateReminderStatus(reminderId: String, status: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("status", status.trim().ifBlank { "active" })
                .toString()
            request("/api/reminders/${reminderId.pathSegment()}", method = "PATCH", body = payload)
            Unit
        }
    }

    suspend fun createTodoTask(
        title: String,
        message: String,
        status: String,
        priority: String,
        dueDate: String,
        assignedToUserId: String,
        invitedUserIds: List<String>,
        workOrderId: String,
        companyId: String,
        locationId: String,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("title", title.trim())
                .put("message", message.trim())
                .put("status", status.trim().ifBlank { "open" })
                .put("priority", priority.trim().ifBlank { "Normal" })
                .put("dueDate", dueDate.trim())
                .put("assignedToUserId", assignedToUserId.trim())
                .put("invitedUserIds", JSONArray(invitedUserIds.map { it.trim() }.filter { it.isNotBlank() }.distinct()))
                .put("workOrderId", workOrderId.trim())
                .put("companyId", companyId.trim())
                .put("locationId", locationId.trim())
                .toString()
            request("/api/todo-tasks", method = "POST", body = payload)
            Unit
        }
    }

    suspend fun updateTodoTask(
        taskId: String,
        status: String? = null,
        priority: String? = null,
        dueDate: String? = null,
        assignedToUserId: String? = null,
        invitedUserIds: List<String>? = null,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
            status?.let { payload.put("status", it.trim()) }
            priority?.let { payload.put("priority", it.trim()) }
            dueDate?.let { payload.put("dueDate", it.trim()) }
            assignedToUserId?.let { payload.put("assignedToUserId", it.trim()) }
            invitedUserIds?.let { values ->
                payload.put("invitedUserIds", JSONArray(values.map { it.trim() }.filter { it.isNotBlank() }.distinct()))
            }
            request("/api/todo-tasks/${taskId.pathSegment()}", method = "PATCH", body = payload.toString())
            Unit
        }
    }

    suspend fun addTodoTaskComment(taskId: String, message: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("message", message.trim())
                .toString()
            request("/api/todo-tasks/${taskId.pathSegment()}/comments", method = "POST", body = payload)
            Unit
        }
    }

    suspend fun createVehicleReservation(
        vehicleId: String,
        purpose: String,
        startAt: String,
        endAt: String,
        destination: String,
        reservedForUserId: String,
        reservedForLabel: String,
        note: String,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("status", "reserved")
                .put("purpose", purpose)
                .put("startAt", startAt)
                .put("endAt", endAt)
                .put("destination", destination)
                .put("reservedForUserId", reservedForUserId)
                .put("reservedForUserIds", JSONArray().put(reservedForUserId).takeIf { reservedForUserId.isNotBlank() } ?: JSONArray())
                .put("reservedForLabel", reservedForLabel)
                .put("reservedForLabels", JSONArray().put(reservedForLabel).takeIf { reservedForLabel.isNotBlank() } ?: JSONArray())
                .put("note", note)
                .toString()
            request("/api/vehicles/${vehicleId.pathSegment()}/reservations", method = "POST", body = payload)
            Unit
        }
    }

    suspend fun recordVehicleUsage(
        vehicleId: String,
        mode: String,
        tripId: String,
        actionAt: String,
        odometerKm: String,
        departureAt: String,
        returnAt: String,
        startKm: String,
        endKm: String,
        destination: String,
        reservationId: String,
        linkedWorkOrderId: String,
        linkedWorkOrderNumber: String,
        performedBy: String,
        driverUserIds: List<String>,
        driverLabels: List<String>,
        vehicleCondition: String,
        vehicleClean: Boolean,
        documentsPresent: Boolean,
        fuelOk: Boolean,
        damageNoted: Boolean,
        note: String,
        files: List<WorkOrderUploadFile> = emptyList(),
        signaturePngBytes: ByteArray? = null,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val fileArray = JSONArray()
            files.forEach { upload ->
                val dataUrl = "data:${upload.fileType};base64,${Base64.getEncoder().encodeToString(upload.bytes)}"
                fileArray.put(
                    JSONObject()
                        .put("fileName", upload.fileName)
                        .put("fileType", upload.fileType)
                        .put("fileSize", upload.fileSize)
                        .put("documentCategory", upload.documentCategory)
                        .put("description", upload.description)
                        .put("dataUrl", dataUrl),
                )
            }
            val signatureDataUrl = signaturePngBytes
                ?.takeIf { it.isNotEmpty() }
                ?.let { "data:image/png;base64,${Base64.getEncoder().encodeToString(it)}" }
                .orEmpty()
            val payload = JSONObject()
                .put("mode", mode)
                .put("tripId", tripId)
                .put("activityItemId", tripId)
                .put("actionAt", actionAt)
                .put("departureAt", departureAt.ifBlank { actionAt })
                .put("returnAt", returnAt)
                .put("startKm", startKm.ifBlank { odometerKm })
                .put("endKm", endKm)
                .put("odometerKm", odometerKm)
                .put("destination", destination)
                .put("reservationId", reservationId)
                .put("linkedWorkOrderId", linkedWorkOrderId)
                .put("linkedWorkOrderIds", JSONArray(listOf(linkedWorkOrderId.trim()).filter { it.isNotBlank() }.distinct()))
                .put("linkedWorkOrderNumber", linkedWorkOrderNumber)
                .put("performedBy", performedBy)
                .put("driverUserIds", JSONArray(driverUserIds.map { it.trim() }.filter { it.isNotBlank() }.distinct()))
                .put("driverLabels", JSONArray(driverLabels.map { it.trim() }.filter { it.isNotBlank() }.distinct()))
                .put("drivers", JSONArray(driverLabels.map { it.trim() }.filter { it.isNotBlank() }.distinct()))
                .put("vehicleCondition", vehicleCondition)
                .put("vehicleClean", vehicleClean)
                .put("documentsPresent", documentsPresent)
                .put("fuelOk", fuelOk)
                .put("damageNoted", damageNoted)
                .put("note", note)
                .put("files", fileArray)
                .put("signatureDataUrl", signatureDataUrl)
                .toString()
            request("/api/vehicles/${vehicleId.pathSegment()}/usage", method = "POST", body = payload)
            Unit
        }
    }

    suspend fun createWorkOrderLocationObject(
        workOrder: WorkOrder,
        name: String,
    ): Result<WorkOrderLocationObjectOption> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("companyId", workOrder.companyId)
                .put("locationId", workOrder.locationId)
                .put("name", name)
                .toString()
            val json = JSONObject(request("/api/mobile/location-objects", method = "POST", body = payload))
            val item = json.optJSONObject("item") ?: JSONObject()
            WorkOrderLocationObjectOption(
                id = item.firstClean("id"),
                companyId = item.firstClean("companyId"),
                locationId = item.firstClean("locationId"),
                name = item.firstClean("name").ifBlank { name },
                code = item.firstClean("code"),
                description = item.firstClean("description"),
            )
        }
    }

    suspend fun registerPushToken(
        token: String,
        platform: String = "android",
        deviceId: String = "",
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            if (token.isBlank()) return@runCatching
            val payload = JSONObject()
                .put("token", token)
                .put("platform", platform)
                .put("deviceId", deviceId)
                .toString()
            request("/api/mobile/push-token", method = "POST", body = payload)
            Unit
        }
    }

    suspend fun unregisterPushToken(token: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            if (token.isBlank()) return@runCatching
            val payload = JSONObject()
                .put("token", token)
                .toString()
            request("/api/mobile/push-token", method = "DELETE", body = payload)
            Unit
        }
    }

    suspend fun listWorkOrderDocuments(workOrderId: String): Result<List<WorkOrderDocument>> = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject(request("/api/work-orders/${workOrderId.pathSegment()}/documents"))
            json.optJSONArray("items").toWorkOrderDocuments()
        }
    }

    suspend fun uploadWorkOrderDocuments(
        workOrderId: String,
        files: List<WorkOrderUploadFile>,
        sourceType: String = "editor",
    ): Result<List<WorkOrderDocument>> = withContext(Dispatchers.IO) {
        runCatching {
            val payloadFiles = JSONArray()
            files.forEach { upload ->
                val dataUrl = "data:${upload.fileType};base64,${Base64.getEncoder().encodeToString(upload.bytes)}"
                payloadFiles.put(
                    JSONObject()
                        .put("fileName", upload.fileName)
                        .put("fileType", upload.fileType)
                        .put("fileSize", upload.fileSize)
                        .put("documentCategory", upload.documentCategory)
                        .put("description", upload.description)
                        .put("dataUrl", dataUrl),
                )
            }
            val payload = JSONObject()
                .put("sourceType", sourceType)
                .put("files", payloadFiles)
                .toString()
            val json = JSONObject(request("/api/work-orders/${workOrderId.pathSegment()}/documents", method = "POST", body = payload))
            json.optJSONArray("items").toWorkOrderDocuments()
        }
    }

    suspend fun downloadPeopleTrainingImportTemplate(
        companyId: String,
    ): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val query = companyId.trim().takeIf { it.isNotBlank() }
                ?.let { "?companyId=${it.pathSegment()}" }
                ?: ""
            val connection = openConnection(
                "/api/people-training-records/import-template$query",
                method = "GET",
                body = null,
                accept = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                readTimeoutMs = PDF_ACTION_READ_TIMEOUT_MS,
            )
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti Excel predložak osposobljavanja (${connection.responseCode})."
                })
            }
            DownloadedDocument(
                fileName = parseContentDispositionFileName(connection.getHeaderField("Content-Disposition"))
                    .ifBlank { "osposobljavanja-import.xlsx" },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
                    ?: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                bytes = bytes,
            )
        }
    }

    suspend fun importPeopleTrainingRecords(
        companyId: String,
        locationId: String,
        fileName: String,
        fileType: String,
        bytes: ByteArray,
        importMode: String = "",
    ): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val cleanCompanyId = companyId.trim()
            if (cleanCompanyId.isBlank()) {
                throw IllegalStateException("RN nema odabranu tvrtku za import osposobljavanja.")
            }
            val mimeType = fileType.ifBlank { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
            val payload = JSONObject()
                .put("companyId", cleanCompanyId)
                .put("locationId", locationId.trim())
                .put("fileName", fileName.ifBlank { "osposobljavanja-import.xlsx" })
                .put("fileType", mimeType)
                .put("dataUrl", "data:$mimeType;base64,${Base64.getEncoder().encodeToString(bytes)}")
                .put("importMode", importMode.trim())
                .toString()
            request(
                "/api/people-training-records/import",
                method = "POST",
                body = payload,
                readTimeoutMs = PDF_ACTION_READ_TIMEOUT_MS,
            )
            "Masovni import ljudi je spremljen."
        }
    }

    suspend fun createPeopleTrainingRecord(
        workOrderId: String,
        companyId: String,
        locationId: String,
        draft: WorkOrderTrainingManualPersonDraft,
    ): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val cleanCompanyId = companyId.trim()
            if (cleanCompanyId.isBlank()) {
                throw IllegalStateException("RN nema odabranu tvrtku za dodavanje osobe.")
            }
            val fullName = draft.fullName.trim()
            if (fullName.isBlank()) {
                throw IllegalStateException("Upiši ime i prezime osobe.")
            }
            val payload = JSONObject()
                .put("companyId", cleanCompanyId)
                .put("locationId", locationId.trim())
                .put("fullName", fullName)
                .put("oib", draft.oib.filter { it.isDigit() })
                .put("email", draft.email.trim())
                .put("phone", draft.phone.trim())
                .put("jobTitle", draft.jobTitle.trim())
                .put("activityStatus", "DA")
                .put("trainingItems", JSONArray())
                .toString()
            val response = request(
                "/api/mobile/work-orders/${workOrderId.pathSegment()}/training/person",
                method = "POST",
                body = payload,
                readTimeoutMs = PDF_ACTION_READ_TIMEOUT_MS,
            )
            JSONObject(response).optString("message").ifBlank { "Osoba je dodana u osposobljavanja." }
        }
    }

    suspend fun generateWorkOrderDocumentation(
        workOrderId: String,
        draft: WorkOrderDocumentationDraft,
    ): Result<List<WorkOrderDocument>> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = draft.toDocumentationJsonPayload(async = true)
            var json = JSONObject(
                request(
                    "/api/mobile/work-orders/${workOrderId.pathSegment()}/generate-documents",
                    method = "POST",
                    body = payload,
                    readTimeoutMs = DOCUMENT_GENERATION_READ_TIMEOUT_MS,
                ),
            )
            val jobId = json.firstClean("jobId", "id")
            var status = json.firstClean("status").lowercase()
            if (jobId.isNotBlank() && (status == "pending" || status == "running")) {
                var attempts = 0
                while (attempts < DOCUMENT_GENERATION_POLL_ATTEMPTS) {
                    delay(DOCUMENT_GENERATION_POLL_INTERVAL_MS)
                    json = JSONObject(
                        request(
                            "/api/mobile/work-orders/${workOrderId.pathSegment()}/generate-documents/jobs/${jobId.pathSegment()}",
                            readTimeoutMs = DEFAULT_READ_TIMEOUT_MS,
                        ),
                    )
                    status = json.firstClean("status").lowercase()
                    if (status == "completed") {
                        break
                    }
                    if (status == "failed") {
                        throw IllegalStateException(
                            json.firstClean("error", "message").ifBlank { "Ne mogu izraditi dokumentaciju RN-a." },
                        )
                    }
                    attempts += 1
                }
                if (status != "completed") {
                    throw IllegalStateException("Izrada dokumentacije još traje. Osvježi dokumentaciju RN-a za nekoliko trenutaka.")
                }
            }
            json.optJSONArray("items").toWorkOrderDocuments()
        }
    }

    suspend fun saveWorkOrderDocumentationDraft(
        workOrderId: String,
        payload: String,
    ): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request(
                "/api/mobile/work-orders/${workOrderId.pathSegment()}/documentation-draft",
                method = "POST",
                body = payload,
                readTimeoutMs = DEFAULT_READ_TIMEOUT_MS,
            )
            Unit
        }
    }

    suspend fun workOrderDocumentationContext(
        workOrderId: String,
        objectId: String = "",
    ): Result<WorkOrderDocumentationContext> = withContext(Dispatchers.IO) {
        runCatching {
            val query = if (objectId.isBlank()) "" else "?objectId=${objectId.pathSegment()}"
            val json = JSONObject(request("/api/mobile/work-orders/${workOrderId.pathSegment()}/documentation-context$query"))
            json.toWorkOrderDocumentationContext()
        }
    }

    suspend fun confirmWorkOrderTraining(
        workOrderId: String,
        mode: String,
        personIds: List<String>,
        serviceKeys: List<String>,
        sendEmails: Boolean = true,
        onlyRecommended: Boolean = true,
    ): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("mode", mode.trim().ifBlank { "online_test" })
                .put("personIds", JSONArray(personIds.map { it.trim() }.filter { it.isNotBlank() }))
                .put("serviceKeys", JSONArray(serviceKeys.map { it.trim() }.filter { it.isNotBlank() }))
                .put("onlyRecommended", onlyRecommended)
                .put("sendEmails", sendEmails)
                .toString()
            val json = JSONObject(
                request(
                    "/api/mobile/work-orders/${workOrderId.pathSegment()}/training/confirm",
                    method = "POST",
                    body = payload,
                    readTimeoutMs = 90_000,
                ),
            )
            json.firstClean("message").ifBlank { "Osposobljavanje je pripremljeno." }
        }
    }

    suspend fun generateWorkOrderTrainingRecord(workOrderId: String): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            val json = JSONObject(
                request(
                    "/api/mobile/work-orders/${workOrderId.pathSegment()}/training-record",
                    method = "POST",
                    body = "{}",
                    readTimeoutMs = 90_000,
                ),
            )
            json.firstClean("message").ifBlank { "Zapisnik osposobljavanja je spremljen u Dokumente." }
        }
    }

    suspend fun submitWorkOrderIsznrWorkEquipment(
        workOrderId: String,
        selectedItemIds: List<String>,
        manualEquipments: List<IsznrManualWorkEquipment> = emptyList(),
    ): Result<IsznrWorkEquipmentSubmitResult> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("selectedItemIds", JSONArray(selectedItemIds.map { it.trim() }.filter { it.isNotBlank() }))
                .put(
                    "manualEquipments",
                    JSONArray(
                        manualEquipments
                            .map { it.toJsonObject() },
                    ),
                )
                .toString()
            val json = JSONObject(
                request(
                    "/api/mobile/work-orders/${workOrderId.pathSegment()}/isznr-work-equipment",
                    method = "POST",
                    body = payload,
                    readTimeoutMs = 90_000,
                ),
            )
            IsznrWorkEquipmentSubmitResult(
                message = json.firstClean("message").ifBlank { "RO zapisnik je poslan u IS ZNR." },
                isznrId = json.firstClean("isznrId"),
                recordNumber = json.firstClean("recordNumber"),
                pdfUrl = json.firstClean("pdfUrl", "isznrPdfUrl"),
                pdfBridgeUrl = absoluteSafeNexusUrl(json.firstClean("pdfBridgeUrl", "isznrPdfBridgeUrl")),
                attachmentSubmitted = json.optJSONObject("attachments")?.optInt("submitted")
                    ?: json.optJSONObject("attachment")?.optInt("submitted")
                    ?: json.optInt("attachmentSubmitted", 0),
                attachmentFailed = json.optJSONObject("attachments")?.optInt("failed")
                    ?: json.optJSONObject("attachment")?.optInt("failed")
                    ?: json.optInt("attachmentFailed", 0),
                equipmentCount = json.optInt("equipmentCount", selectedItemIds.size + manualEquipments.size),
                submittedAt = json.firstClean("submittedAt"),
            )
        }
    }

    suspend fun submitWorkOrderIsznrPhysicalFactors(
        workOrderId: String,
        selectedItemIds: List<String>,
        manualPhysicalFactors: IsznrManualPhysicalFactors = IsznrManualPhysicalFactors(),
    ): Result<IsznrWorkEquipmentSubmitResult> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("selectedItemIds", JSONArray(selectedItemIds.map { it.trim() }.filter { it.isNotBlank() }))
                .put(
                    "common",
                    JSONObject()
                        .put("inspectionDate", manualPhysicalFactors.startDate.trim())
                        .put("issuedDate", manualPhysicalFactors.endDate.trim())
                        .put("testingLocation", manualPhysicalFactors.location.trim())
                        .put("outsideTemperature", manualPhysicalFactors.airTemperature.trim())
                        .put("relativeHumidity", manualPhysicalFactors.relativeAirHumidity.trim())
                        .put("airflowSpeed", manualPhysicalFactors.airFlowSpeed.trim()),
                )
                .put("manualPhysicalFactors", manualPhysicalFactors.toJsonObject())
                .toString()
            val json = JSONObject(
                request(
                    "/api/mobile/work-orders/${workOrderId.pathSegment()}/isznr-work-environment",
                    method = "POST",
                    body = payload,
                    readTimeoutMs = 90_000,
                ),
            )
            IsznrWorkEquipmentSubmitResult(
                message = json.firstClean("message").ifBlank { "FC zapisnik je poslan u IS ZNR." },
                isznrId = json.firstClean("isznrId"),
                recordNumber = json.firstClean("recordNumber"),
                pdfUrl = json.firstClean("pdfUrl", "isznrPdfUrl"),
                pdfBridgeUrl = absoluteSafeNexusUrl(json.firstClean("pdfBridgeUrl", "isznrPdfBridgeUrl")),
                equipmentCount = json.optInt("sourceRecordCount", selectedItemIds.size + if (manualPhysicalFactors.isReadyForIsznrPost()) 1 else 0),
                submittedAt = json.firstClean("submittedAt"),
            )
        }
    }

    private fun absoluteSafeNexusUrl(value: String): String {
        val trimmed = value.trim()
        if (trimmed.isBlank()) return ""
        if (trimmed.startsWith("http://", ignoreCase = true) || trimmed.startsWith("https://", ignoreCase = true)) {
            return trimmed
        }
        return if (trimmed.startsWith("/")) "$baseUrl$trimmed" else "$baseUrl/$trimmed"
    }

    suspend fun prepareWorkOrderDocumentationAi(
        workOrderId: String,
        workOrderNumber: String,
        template: WorkOrderDocumentationTemplate,
        files: List<WorkOrderDocumentationAiFile>,
        modelTier: String = "standard",
    ): Result<WorkOrderDocumentationAiResult> = withContext(Dispatchers.IO) {
        runCatching {
            val payload = JSONObject()
                .put("purpose", "document-template-runtime-ai-prefill")
                .put("templateId", template.id)
                .put("templateTitle", template.title)
                .put("templateServiceCode", template.serviceCode)
                .put("serviceCode", template.serviceCode)
                .put("serviceName", template.serviceName)
                .put("workOrderId", workOrderId)
                .put("workOrderNumber", workOrderNumber)
                .put("files", files.toDocumentationAiFilesJsonArray())
                .put("fields", template.aiFields.toDocumentationAiFieldsJsonArray())
                .put("columns", template.aiMeasurementColumns.toDocumentationAiColumnsJsonArray())
                .put("modelTier", modelTier.ifBlank { "standard" })
                .put("modelPreference", JSONObject().put("tier", modelTier.ifBlank { "standard" }))
                .put("dryRun", false)
                .toString()
            val json = JSONObject(
                request(
                    "/api/ai/openai/prepare",
                    method = "POST",
                    body = payload,
                    readTimeoutMs = OPENAI_PREPARE_READ_TIMEOUT_MS,
                ),
            )
            json.toWorkOrderDocumentationAiResult()
        }
    }

    suspend fun recognizeWorkEquipmentFromImages(
        workOrder: WorkOrder,
        equipment: IsznrManualWorkEquipment,
        files: List<IsznrRoAttachmentFile>,
        recognitionMode: String = WORK_EQUIPMENT_RECOGNITION_TEMPLATE,
        modelTier: String = "strong",
    ): Result<WorkEquipmentImageRecognitionResult> = withContext(Dispatchers.IO) {
        runCatching {
            val normalizedRecognitionMode = normalizeWorkEquipmentRecognitionMode(recognitionMode)
            val payloadFiles = JSONArray()
            files.filter { it.contentDataUrl.isNotBlank() }.take(16).forEachIndexed { index, file ->
                payloadFiles.put(
                    JSONObject()
                        .put("id", file.id.ifBlank { "ro-image-${index + 1}" })
                        .put("name", file.fileName.ifBlank { "RO slika ${index + 1}" })
                        .put("fileName", file.fileName.ifBlank { "RO slika ${index + 1}" })
                        .put("type", file.fileType.ifBlank { "image/jpeg" })
                        .put("fileType", file.fileType.ifBlank { "image/jpeg" })
                        .put("size", file.fileSize)
                        .put("fileSize", file.fileSize)
                        .put("dataUrl", file.contentDataUrl)
                        .put("contentDataUrl", file.contentDataUrl)
                        .put("imageOrder", index + 1),
                )
            }
            val fields = JSONArray(
                listOf(
                    JSONObject().put("id", "name").put("key", "name").put("label", "Naziv radne opreme")
                        .put("instructions", "Prepoznaj vrstu/naziv stroja ili dijela radne opreme iz fotografije cijelog stroja/dijela i natpisne plocice. Ako plocica ne postoji ili nije citljiva, procijeni o kojem je dijelu opreme rijec prema vidljivom obliku i funkciji. Ako se vidi Bosch BEA, naziv moze biti analizator ispusnih plinova."),
                    JSONObject().put("id", "manufacturer").put("key", "manufacturer").put("label", "Proizvodac")
                        .put("instructions", "Prednost ima natpisna plocica i logotip. BOSCH ili Robert Bosch GmbH vrati kao BOSCH."),
                    JSONObject().put("id", "model").put("key", "model").put("label", "Tip / model")
                        .put("instructions", "Prepisuj oznake uz Type, Typ, Model ili istaknuti model s uredaja. Primjeri: BEA750, BEA 750, L16."),
                    JSONObject().put("id", "serialNumber").put("key", "serialNumber").put("label", "Serijski broj")
                        .put("instructions", "Prepisuj oznaku uz Serial number, S/N, Ser. No. ili serial. Ne mijesaj s part number."),
                    JSONObject().put("id", "inventoryNumber").put("key", "inventoryNumber").put("label", "Inventarski broj")
                        .put("instructions", "Vrati samo ako je posebno oznacen kao inventarski broj, inv. broj ili naljepnica inventara."),
                    JSONObject().put("id", "technicalData").put("key", "technicalData").put("label", "Tehnicki podaci")
                        .put("instructions", "Sazmi Part number, MD/godinu, napon U[V], frekvenciju, snagu P[W], tlak, mjerni raspon i druge kljucne podatke s plocice."),
                    JSONObject().put("id", "purposeDescription").put("key", "purposeDescription").put("label", "Namjena radne opreme")
                        .put("instructions", "Iz slike cijelog stroja, komandi, prikljucaka i plocice zakljuci namjenu opreme. Ne ostavljaj prazno ako je vrsta stroja prepoznata."),
                    JSONObject().put("id", "workspacePosition").put("key", "workspacePosition").put("label", "Polozaj u radnom prostoru")
                        .put("instructions", "Opisi gdje je oprema postavljena ili kako se koristi u prostoru: samostojeca, na kotacima, na radnom mjestu, servisni uredaj, radni stol i slicno."),
                    JSONObject().put("id", "workingSubstancesAndRawMaterials").put("key", "workingSubstancesAndRawMaterials").put("label", "Radne tvari i sirovine")
                        .put("instructions", "Navedi samo direktnu radnu tvar, medij ili sirovinu, ne opis fotografije. Ako je spremnik/UNP/LPG/plin, pisi tocno 'Radna tvar: UNP.' Ako je kompresor, pisi 'Radni medij: stlaceni zrak.' Ako je gorivo/ulje/ispusni plin/prasina/elektricka energija, navedi to kratko u istom stilu."),
                    JSONObject().put("id", "useAndMaintenance").put("key", "useAndMaintenance").put("label", "Uporaba i odrzavanje")
                        .put("instructions", "Sazmi uporabu i odrzavanje prema vidljivim komandama, prikljuccima, sondama, kotačima, servisnim elementima i dokumentaciji; ne cekaj samo plocicu."),
                    JSONObject().put("id", "methodsProceduresAndNorms").put("key", "methodsProceduresAndNorms").put("label", "Metode, postupci i norme")
                        .put("instructions", "Predlozi opci postupak pregleda/ispitivanja za prepoznatu opremu: vizualni pregled, funkcionalna proba, provjera zastitnih naprava, elektro pregled ako je prikljucna oprema."),
                    JSONObject().put("id", "deficiencies").put("key", "deficiencies").put("label", "Nedostaci")
                        .put("instructions", "Pisi blago i tehnicki. Ako nema jasnih nedostataka iz slika, vrati 'Bez vidljivih nedostataka na dostavljenim slikama.' Ne pisi ostro tipa zabraniti rad ili opasno stanje osim ako je kvar jasno vidljiv."),
                    JSONObject().put("id", "measuresToEliminateDeficiencies").put("key", "measuresToEliminateDeficiencies").put("label", "Mjere")
                        .put("instructions", "Ako nema nedostataka, vrati 'Nisu potrebne posebne mjere prema dostavljenim slikama.' Ako je nesto nesigurno, preporuci dodatnu provjeru ili dokumentiranje. Ostro formuliraj samo jasno vidljive nedostatke."),
                    JSONObject().put("id", "mechanicalItems").put("key", "mechanicalItems").put("label", "Strojarski dio")
                        .put("instructions", "Vrati relevantne strojarske stavke za ovaj stroj odmah iz slike cijelog stroja, komandi, zastita, pokretnih dijelova, stabilnosti i plocice. Ciljaj najmanje 12 relevantnih stavki kada fotografije daju dovoljno konteksta. Napomena/vrijednost nije rucni uvjet, ali AI ne smije vracati prazne stavke: svaka vracena stavka treba imati label, meetsConditions i konkretan customContent do 255 znakova kada postoji siguran izvor. Ako bi napisao treba provjeriti/potvrditi, vrati pitanje u verificationQuestions umjesto stavke. U customContent ne pisi 'vidi se na fotografiji/slici'; pisi direktan nalaz."),
                    JSONObject().put("id", "electricalItems").put("key", "electricalItems").put("label", "Elektro dio")
                        .put("instructions", "Ako oprema ima kabel, utikac, napajanje, elektromotor, upravljacku elektroniku, sonde ili plocicu s U/F/P podacima, vrati relevantne elektro stavke. Ne ostavljaj elektro dio prazan za elektricnu opremu kada postoji siguran izvor. Napomena/vrijednost nije rucni uvjet, ali AI ne smije vracati prazne stavke: svaka vracena stavka treba imati konkretan customContent do 255 znakova kada postoji siguran izvor. Ako bi napisao treba provjeriti/potvrditi, vrati pitanje u verificationQuestions umjesto stavke. U customContent ne pisi 'vidi se na fotografiji/slici'; pisi direktan nalaz."),
                    JSONObject().put("id", "riskRegisterIris").put("key", "hazardRegisterIris").put("label", "Opasnosti, stetnosti i napori")
                        .put("instructions", "Vrati hazardRegisterIris, harmfulnessRegisterIris i strainRegisterIris za prepoznate opasnosti, stetnosti i napore. Za UNP/LPG/gorivo/plin ukljuci pozar i eksploziju te kemijske stetnosti. Za elektricnu opremu ukljuci elektricnu struju. Za rucno pomicanje, podizanje ili rad u polozaju ukljuci statodinamicke napore. Ako IRI nije siguran, vrati pitanje u verificationQuestions."),
                ),
            )
            val body = JSONObject()
                .put("purpose", "mobile-work-equipment-image-recognition")
                .put("dryRun", false)
                .put("recognitionMode", normalizedRecognitionMode)
                .put("modelTier", modelTier.ifBlank { "strong" })
                .put("modelPreference", JSONObject().put("tier", modelTier.ifBlank { "strong" }))
                .put("workOrderId", workOrder.id)
                .put("workOrderNumber", workOrder.displayNumber)
                .put("files", payloadFiles)
                .put("fields", fields)
                .put(
                    "context",
                    JSONObject()
                        .put("mode", "single-work-equipment")
                        .put("recognitionMode", normalizedRecognitionMode)
                        .put("companyName", workOrder.companyName)
                        .put("locationName", workOrder.locationName)
                        .put("currentEquipment", equipment.toJsonObject())
                        .put("profiles", workEquipmentRoProfilesJson())
                        .put("registers", workEquipmentRoRegisterGroupsJson())
                        .put(
                            "imageRule",
                            "Ovaj poziv popunjava samo trenutno otvorenu RO kolonu ili njezin dio. Slike tretiraj kao jednu radnu opremu ili jedan dio radne opreme; ako ih ima vise, koristi najpouzdanije slike za taj jedan stroj/dio. Pravilo snimanja je: prvo slika stroja ili dijela izdaleka, zatim plocica ako postoji. Ako plocice nema, procijeni naziv i funkciju iz fotografije.",
                        )
                        .put(
                            "databaseRule",
                            "Ako prepoznati proizvodac, model ili serijski broj odgovara postojecoj bazi ili lokalnoj povijesti u kontekstu, vrati matchedSource i popuni podatke iz najpouzdanijeg izvora.",
                        )
                        .put(
                            "dedupeRule",
                            "U currentEquipments su trenutne RO kolone. Ako prepoznas isti stroj, svejedno vrati zaseban workEquipments zapis sa serijskim/inventarskim/model podacima; Android ce prije upisa prikazati popis i spojiti s postojecim kolonama bez duplikata.",
                        )
                        .put(
                            "assessmentRule",
                            if (normalizedRecognitionMode == WORK_EQUIPMENT_RECOGNITION_TEMPLATE) {
                                workEquipmentRoTemplateAssessmentRule(batchMode = false)
                            } else {
                                "Za RO zapisnik ne staj na plocici. Nakon citanja plocice obavezno procijeni cijeli stroj: namjenu, polozaj, radne tvari, uporabu/odrzavanje, strojarski dio, elektro dio, opasnosti, stetnosti i napore. Biraj profil iz context.profiles i stavke iz context.registers. Postuj aiInstruction uz svaku stavku i koristi profile.registerInstructions kao vise profilnih primjera po strojarskoj/elektro stavci. Popuni strojarski dio samo za relevantne stavke, ali kada je moguce vrati barem 12 strojarskih stavki. Za opremu s napajanjem, kabelom, utikacem, elektromotorom, elektronikom, uzemljenjem ili U/F/P podacima vrati elektro stavke kada postoji siguran izvor. Ne popunjavaj svaku mogucu stavku. Napomena/vrijednost nije rucni uvjet ni IS ZNR blocker, ali AI preview ne smije vracati prazne stavke: svaka vracena mehanicka/elektro stavka treba imati konkretan customContent do 255 znakova kada postoji siguran izvor. Radne tvari pisi kao polje, ne kao opis slike: 'Radna tvar: UNP.', 'Radni medij: stlaceni zrak.', 'Radna tvar: hidraulicno ulje.' Nedostatke i mjere formuliraj blago: bez vidljivih nedostataka, preporucuje se dodatna provjera, preporucuje se dokumentirati. Ne pisi ostro 'zabraniti rad' ili 'opasno stanje' osim za jasno vidljiv kritican nedostatak. measuredValue koristi samo ako postoji stvarno mjerenje. U customContent i opisnim poljima ne smije ici 'treba provjeriti', 'treba potvrditi', 'potrebno je utvrditi', 'vidi se na fotografiji', 'na slici se vidi' ni slicno. Ako je nalaz siguran, napisi ga direktno kao cinjenicu. Ako je potrebna funkcionalna provjera ili odgovor korisnika, dodaj pitanje u verificationQuestions i nemoj vratiti tu stavku kao gotov nalaz. Primjeri gotovog nalaza: Ukljucivanje je izvedeno kljucem. Upravljanje je pomocu rucica i volana. Prikljucni kabel i utikac su neosteceni. Dodaj opasnosti, stetnosti i napore koji proizlaze iz stroja, plocice, radne tvari, nacina rada ili okruzenja."
                            },
                        ),
                )
                .put(
                    "expectedJsonShape",
                    JSONObject()
                        .put(
                            "workEquipments",
                            JSONArray().put(
                                JSONObject()
                                    .put("profileId", "id prepoznatog profila/templatea")
                                    .put("profileName", "naziv prepoznatog profila/templatea")
                                    .put("name", "naziv opreme")
                                    .put("manufacturer", "proizvodac")
                                    .put("model", "tip/model")
                                    .put("serialNumber", "serijski broj")
                                    .put("inventoryNumber", "inventarski broj")
                                    .put("technicalData", "kljucni tehnicki podaci")
                                    .put("purposeDescription", "namjena opreme")
                                    .put("workspacePosition", "mjesto rada / polozaj")
                                    .put("workingSubstancesAndRawMaterials", "radne tvari ili sirovine")
                                    .put("useAndMaintenance", "koristenje i odrzavanje")
                                    .put("methodsProceduresAndNorms", "metode, postupci i norme")
                                    .put("deficiencies", "nedostaci ili bez vidljivih nedostataka")
                                    .put("measuresToEliminateDeficiencies", "mjere za uklanjanje nedostataka")
                                    .put("finalGrade", "1 ili 0")
                                    .put("matchedSource", "izvor/baza ako je pronadeno")
                                    .put("confidence", "high/medium/low")
                                    .put("verificationQuestions", JSONArray().put("pitanje za korisnika kada nalaz treba funkcionalnu provjeru ili rucnu potvrdu"))
                                    .put(
                                        "mechanicalItems",
                                        JSONArray().put(
                                            JSONObject()
                                                .put("registerIri", "IRI ako je siguran ili prazno")
                                                .put("label", "naziv relevantne strojarske stavke")
                                                .put("meetsConditions", true)
                                                .put("customContent", "konkretna napomena do 255 znakova kada postoji siguran izvor")
                                                .put("measuredValue", "izmjerena vrijednost ako postoji"),
                                        ),
                                    )
                                    .put(
                                        "electricalItems",
                                        JSONArray().put(
                                            JSONObject()
                                                .put("registerIri", "IRI ako je siguran ili prazno")
                                                .put("label", "naziv relevantne elektro stavke")
                                                .put("meetsConditions", true)
                                                .put("customContent", "konkretna elektro napomena do 255 znakova kada postoji siguran izvor")
                                                .put("measuredValue", "izmjerena vrijednost ako postoji"),
                                        ),
                                    )
                                    .put("hazardRegisterIris", JSONArray().put("IRI opasnosti ako je siguran"))
                                    .put("harmfulnessRegisterIris", JSONArray().put("IRI stetnosti ako je siguran"))
                                    .put("strainRegisterIris", JSONArray().put("IRI napora ako je siguran")),
                            ),
                        )
                        .put("summary", "kratak sazetak prepoznavanja"),
                )
                .toString()
            val json = JSONObject(
                request(
                    "/api/ai/openai/prepare",
                    method = "POST",
                    body = body,
                    readTimeoutMs = OPENAI_PREPARE_READ_TIMEOUT_MS,
                ),
            )
            json.toWorkEquipmentImageRecognitionResult()
        }
    }

    suspend fun recognizeWorkEquipmentBatchFromImages(
        workOrder: WorkOrder,
        currentEquipments: List<IsznrManualWorkEquipment>,
        files: List<IsznrRoAttachmentFile>,
        selectedProfileId: String = "",
        selectedProfileName: String = "",
        userNote: String = "",
        recognitionMode: String = WORK_EQUIPMENT_RECOGNITION_TEMPLATE,
        modelTier: String = "strong",
    ): Result<WorkEquipmentImageRecognitionResult> = withContext(Dispatchers.IO) {
        runCatching {
            val normalizedRecognitionMode = normalizeWorkEquipmentRecognitionMode(recognitionMode)
            val payloadFiles = JSONArray()
            files.filter { it.contentDataUrl.isNotBlank() }.take(RO_BATCH_AI_MAX_FILES).forEachIndexed { index, file ->
                payloadFiles.put(
                    JSONObject()
                        .put("id", file.id.ifBlank { "ro-batch-image-${index + 1}" })
                        .put("name", file.fileName.ifBlank { "RO batch slika ${index + 1}" })
                        .put("fileName", file.fileName.ifBlank { "RO batch slika ${index + 1}" })
                        .put("type", file.fileType.ifBlank { "image/jpeg" })
                        .put("fileType", file.fileType.ifBlank { "image/jpeg" })
                        .put("size", file.fileSize)
                        .put("fileSize", file.fileSize)
                        .put("dataUrl", file.contentDataUrl)
                        .put("contentDataUrl", file.contentDataUrl)
                        .put("imageOrder", index + 1),
                )
            }
            val fields = JSONArray(
                listOf(
                    JSONObject().put("id", "name").put("key", "name").put("label", "Naziv radne opreme")
                        .put("instructions", "Za svaki prepoznati stroj vrati stvarni naziv/vrstu opreme iz slike cijelog stroja i plocice."),
                    JSONObject().put("id", "manufacturer").put("key", "manufacturer").put("label", "Proizvodac")
                        .put("instructions", "Prednost ima natpisna plocica i logotip. BOSCH ili Robert Bosch GmbH vrati kao BOSCH."),
                    JSONObject().put("id", "model").put("key", "model").put("label", "Tip / model")
                        .put("instructions", "Prepisuj oznake uz Type, Typ, Model ili istaknuti model s uredaja. Primjeri: BEA750, BEA 750, L16."),
                    JSONObject().put("id", "serialNumber").put("key", "serialNumber").put("label", "Serijski broj")
                        .put("instructions", "Prepisuj oznaku uz Serial number, S/N, Ser. No. ili serial. Ne mijesaj s part number."),
                    JSONObject().put("id", "inventoryNumber").put("key", "inventoryNumber").put("label", "Inventarski broj")
                        .put("instructions", "Vrati samo ako je posebno oznacen kao inventarski broj, inv. broj ili naljepnica inventara."),
                    JSONObject().put("id", "technicalData").put("key", "technicalData").put("label", "Tehnicki podaci")
                        .put("instructions", "Sazmi Part number, MD/godinu, napon U[V], frekvenciju, snagu P[W], tlak, mjerni raspon i druge kljucne podatke s plocice."),
                    JSONObject().put("id", "purposeDescription").put("key", "purposeDescription").put("label", "Namjena radne opreme")
                        .put("instructions", "Za svaku prepoznatu opremu zakljuci namjenu iz slike cijelog stroja, komandi, prikljucaka i plocice. Ne ostavljaj prazno ako je vrsta stroja prepoznata."),
                    JSONObject().put("id", "workspacePosition").put("key", "workspacePosition").put("label", "Polozaj u radnom prostoru")
                        .put("instructions", "Opisi gdje je oprema postavljena ili kako se koristi u prostoru: samostojeca, na kotacima, na radnom mjestu, servisni uredaj, radni stol i slicno."),
                    JSONObject().put("id", "workingSubstancesAndRawMaterials").put("key", "workingSubstancesAndRawMaterials").put("label", "Radne tvari i sirovine")
                        .put("instructions", "Navedi samo direktnu radnu tvar, medij ili sirovinu, ne opis fotografije. Ako je spremnik/UNP/LPG/plin, pisi tocno 'Radna tvar: UNP.' Ako je kompresor, pisi 'Radni medij: stlaceni zrak.' Ako je gorivo/ulje/ispusni plin/prasina/elektricka energija, navedi to kratko u istom stilu."),
                    JSONObject().put("id", "useAndMaintenance").put("key", "useAndMaintenance").put("label", "Uporaba i odrzavanje")
                        .put("instructions", "Sazmi uporabu i odrzavanje prema vidljivim komandama, prikljuccima, sondama, kotacima, servisnim elementima i dokumentaciji; ne cekaj samo plocicu."),
                    JSONObject().put("id", "methodsProceduresAndNorms").put("key", "methodsProceduresAndNorms").put("label", "Metode, postupci i norme")
                        .put("instructions", "Predlozi opci postupak pregleda/ispitivanja za prepoznatu opremu: vizualni pregled, funkcionalna proba, provjera zastitnih naprava, elektro pregled ako je prikljucna oprema."),
                    JSONObject().put("id", "deficiencies").put("key", "deficiencies").put("label", "Nedostaci")
                        .put("instructions", "Pisi blago i tehnicki. Ako nema jasnih nedostataka iz slika, vrati 'Bez vidljivih nedostataka na dostavljenim slikama.' Ne pisi ostro tipa zabraniti rad ili opasno stanje osim ako je kvar jasno vidljiv."),
                    JSONObject().put("id", "measuresToEliminateDeficiencies").put("key", "measuresToEliminateDeficiencies").put("label", "Mjere")
                        .put("instructions", "Ako nema nedostataka, vrati 'Nisu potrebne posebne mjere prema dostavljenim slikama.' Ako je nesto nesigurno, preporuci dodatnu provjeru ili dokumentiranje. Ostro formuliraj samo jasno vidljive nedostatke."),
                    JSONObject().put("id", "mechanicalItems").put("key", "mechanicalItems").put("label", "Strojarski dio")
                        .put("instructions", "Za svaku prepoznatu opremu vrati relevantne strojarske stavke odmah iz slike cijelog stroja, komandi, zastita, pokretnih dijelova, stabilnosti i plocice. Ciljaj najmanje 12 relevantnih stavki kada fotografije daju dovoljno konteksta. Napomena/vrijednost nije rucni uvjet, ali AI ne smije vracati prazne stavke: svaka vracena stavka treba imati label, meetsConditions i konkretan customContent do 255 znakova kada postoji siguran izvor. Ako bi napisao treba provjeriti/potvrditi, vrati pitanje u verificationQuestions umjesto stavke. U customContent ne pisi 'vidi se na fotografiji/slici'; pisi direktan nalaz."),
                    JSONObject().put("id", "electricalItems").put("key", "electricalItems").put("label", "Elektro dio")
                        .put("instructions", "Ako oprema ima kabel, utikac, napajanje, elektromotor, upravljacku elektroniku, sonde ili plocicu s U/F/P podacima, vrati relevantne elektro stavke kada postoji siguran izvor. Napomena/vrijednost nije rucni uvjet, ali AI ne smije vracati prazne stavke: svaka vracena stavka treba imati konkretan customContent do 255 znakova kada postoji siguran izvor. Ako bi napisao treba provjeriti/potvrditi, vrati pitanje u verificationQuestions umjesto stavke. U customContent ne pisi 'vidi se na fotografiji/slici'; pisi direktan nalaz."),
                    JSONObject().put("id", "riskRegisterIris").put("key", "hazardRegisterIris").put("label", "Opasnosti, stetnosti i napori")
                        .put("instructions", "Vrati hazardRegisterIris, harmfulnessRegisterIris i strainRegisterIris za prepoznate opasnosti, stetnosti i napore. Za UNP/LPG/gorivo/plin ukljuci pozar i eksploziju te kemijske stetnosti. Za elektricnu opremu ukljuci elektricnu struju. Za rucno pomicanje, podizanje ili rad u polozaju ukljuci statodinamicke napore. Ako IRI nije siguran, vrati pitanje u verificationQuestions."),
                ),
            )
            val body = JSONObject()
                .put("purpose", "mobile-work-equipment-image-recognition")
                .put("dryRun", false)
                .put("recognitionMode", normalizedRecognitionMode)
                .put("modelTier", modelTier.ifBlank { "strong" })
                .put("modelPreference", JSONObject().put("tier", modelTier.ifBlank { "strong" }))
                .put("workOrderId", workOrder.id)
                .put("workOrderNumber", workOrder.displayNumber)
                .put("files", payloadFiles)
                .put("fields", fields)
                .put(
                    "context",
                    JSONObject()
                        .put("mode", "batch-work-equipment")
                        .put("recognitionMode", normalizedRecognitionMode)
                        .put("maxBatchImages", RO_BATCH_AI_MAX_FILES)
                        .put("companyName", workOrder.companyName)
                        .put("locationName", workOrder.locationName)
                        .put("currentEquipments", JSONArray(currentEquipments.map { it.toJsonObject() }))
                        .put("profiles", workEquipmentRoProfilesJson())
                        .put("selectedProfileId", selectedProfileId.trim())
                        .put("selectedProfileName", selectedProfileName.trim())
                        .put("userFieldNote", userNote.trim())
                        .put("registers", workEquipmentRoRegisterGroupsJson())
                        .put(
                            "imageRule",
                            "Ovo je batch upload iznad popisa RO opreme. U slikama moze biti vise strojeva. Grupiraj kronoloski: cijeli stroj, natpisna plocica i detalji pripadaju istoj opremi dok se ne pojavi ocito novi stroj. Vrati zaseban workEquipments zapis za svaki prepoznati stroj.",
                        )
                        .put(
                            "profileRule",
                            if (selectedProfileId.isNotBlank() || selectedProfileName.isNotBlank()) {
                                "Korisnik je prije slanja odabrao profil '${selectedProfileName.trim().ifBlank { selectedProfileId.trim() }}'. Taj profil ima prednost pred automatskim pogadanjem, osim ako slike jasno prikazuju drugu vrstu opreme. U tom slucaju navedi neslaganje u summary/verificationQuestions."
                            } else {
                                "Korisnik nije rucno odabrao profil; odaberi najblizi profil iz context.profiles prema slikama i korisnickoj napomeni."
                            },
                        )
                        .put(
                            "userNoteRule",
                            "userFieldNote je korisnikov terenski opis ili diktat. Koristi ga kao dodatni izvor za naziv stroja, radnu tvar, lokaciju, elektro dio, strojarski dio, opasnosti, stetnosti i napore. Ako userFieldNote proturjeci slici, ne izmisljaj nego dodaj pitanje za provjeru.",
                        )
                        .put(
                            "databaseRule",
                            "Ako prepoznati proizvodac, model ili serijski broj odgovara postojecoj bazi ili lokalnoj povijesti u kontekstu, vrati matchedSource i popuni podatke iz najpouzdanijeg izvora.",
                        )
                        .put(
                            "assessmentRule",
                            if (normalizedRecognitionMode == WORK_EQUIPMENT_RECOGNITION_TEMPLATE) {
                                workEquipmentRoTemplateAssessmentRule(batchMode = true)
                            } else {
                                "Za svaku RO opremu ne staj na plocici. Nakon citanja plocice obavezno procijeni cijeli stroj: namjenu, polozaj, radne tvari, uporabu/odrzavanje, strojarski dio, elektro dio, opasnosti, stetnosti i napore. Biraj profil iz context.profiles i stavke iz context.registers. Postuj aiInstruction uz svaku stavku i koristi profile.registerInstructions kao vise profilnih primjera po strojarskoj/elektro stavci. Popuni strojarski dio samo za relevantne stavke, ali kada je moguce vrati barem 12 strojarskih stavki. Za opremu s napajanjem, kabelom, utikacem, elektromotorom, elektronikom, uzemljenjem ili U/F/P podacima vrati elektro stavke kada postoji siguran izvor. Ne popunjavaj svaku mogucu stavku. Napomena/vrijednost nije rucni uvjet ni IS ZNR blocker, ali AI preview ne smije vracati prazne stavke: svaka vracena mehanicka/elektro stavka treba imati konkretan customContent do 255 znakova kada postoji siguran izvor. Radne tvari pisi kao polje, ne kao opis slike: 'Radna tvar: UNP.', 'Radni medij: stlaceni zrak.', 'Radna tvar: hidraulicno ulje.' Nedostatke i mjere formuliraj blago: bez vidljivih nedostataka, preporucuje se dodatna provjera, preporucuje se dokumentirati. Ne pisi ostro 'zabraniti rad' ili 'opasno stanje' osim za jasno vidljiv kritican nedostatak. measuredValue koristi samo ako postoji stvarno mjerenje. U customContent i opisnim poljima ne smije ici 'treba provjeriti', 'treba potvrditi', 'potrebno je utvrditi', 'vidi se na fotografiji', 'na slici se vidi' ni slicno. Ako je nalaz siguran, napisi ga direktno kao cinjenicu. Ako je potrebna funkcionalna provjera ili odgovor korisnika, dodaj pitanje u verificationQuestions i nemoj vratiti tu stavku kao gotov nalaz. Primjeri gotovog nalaza: Ukljucivanje je izvedeno kljucem. Upravljanje je pomocu rucica i volana. Prikljucni kabel i utikac su neosteceni. Dodaj opasnosti, stetnosti i napore koji proizlaze iz stroja, plocice, radne tvari, nacina rada ili okruzenja. Prve dvije slike grupe smatraj slikom stroja i slikom plocice te ih vrati kroz imageIndexes/sourceImageNames."
                            },
                        ),
                )
                .put(
                    "expectedJsonShape",
                    JSONObject()
                        .put(
                            "workEquipments",
                            JSONArray().put(
                                JSONObject()
                                    .put("profileId", "id prepoznatog profila/templatea")
                                    .put("profileName", "naziv prepoznatog profila/templatea")
                                    .put("name", "naziv opreme")
                                    .put("manufacturer", "proizvodac")
                                    .put("model", "tip/model")
                                    .put("serialNumber", "serijski broj")
                                    .put("inventoryNumber", "inventarski broj")
                                    .put("technicalData", "kljucni tehnicki podaci")
                                    .put("purposeDescription", "namjena opreme")
                                    .put("workspacePosition", "mjesto rada / polozaj")
                                    .put("workingSubstancesAndRawMaterials", "radne tvari ili sirovine")
                                    .put("useAndMaintenance", "koristenje i odrzavanje")
                                    .put("methodsProceduresAndNorms", "metode, postupci i norme")
                                    .put("deficiencies", "nedostaci ili bez vidljivih nedostataka")
                                    .put("measuresToEliminateDeficiencies", "mjere za uklanjanje nedostataka")
                                    .put("finalGrade", "1 ili 0")
                                    .put("matchedSource", "izvor/baza ako je pronadeno")
                                    .put("confidence", "high/medium/low")
                                    .put("imageIndexes", JSONArray().put(1).put(2))
                                    .put("sourceImageNames", JSONArray().put("naziv slike"))
                                    .put("verificationQuestions", JSONArray().put("pitanje za korisnika kada nalaz treba funkcionalnu provjeru ili rucnu potvrdu"))
                                    .put(
                                        "mechanicalItems",
                                        JSONArray().put(
                                            JSONObject()
                                                .put("registerIri", "IRI ako je siguran ili prazno")
                                                .put("label", "naziv relevantne strojarske stavke")
                                                .put("meetsConditions", true)
                                                .put("customContent", "konkretna napomena do 255 znakova kada postoji siguran izvor")
                                                .put("measuredValue", "izmjerena vrijednost ako postoji"),
                                        ),
                                    )
                                    .put(
                                        "electricalItems",
                                        JSONArray().put(
                                            JSONObject()
                                                .put("registerIri", "IRI ako je siguran ili prazno")
                                                .put("label", "naziv relevantne elektro stavke")
                                                .put("meetsConditions", true)
                                                .put("customContent", "konkretna elektro napomena do 255 znakova kada postoji siguran izvor")
                                                .put("measuredValue", "izmjerena vrijednost ako postoji"),
                                        ),
                                    )
                                    .put("hazardRegisterIris", JSONArray().put("IRI opasnosti ako je siguran"))
                                    .put("harmfulnessRegisterIris", JSONArray().put("IRI stetnosti ako je siguran"))
                                    .put("strainRegisterIris", JSONArray().put("IRI napora ako je siguran")),
                            ),
                        )
                        .put("summary", "kratak sazetak batch prepoznavanja"),
                )
                .toString()
            val json = JSONObject(
                request(
                    "/api/ai/openai/prepare",
                    method = "POST",
                    body = body,
                    readTimeoutMs = OPENAI_PREPARE_READ_TIMEOUT_MS,
                ),
            )
            json.toWorkEquipmentImageRecognitionBatchResult()
        }
    }

    suspend fun recognizeWorkEquipmentFromText(
        workOrder: WorkOrder,
        equipment: IsznrManualWorkEquipment,
        transcript: String,
        isStrojeviTemplate: Boolean = false,
        modelTier: String = "strong",
    ): Result<WorkEquipmentImageRecognitionResult> = withContext(Dispatchers.IO) {
        runCatching {
            val fields = JSONArray(
                listOf(
                    JSONObject().put("id", "name").put("key", "name").put("label", "Naziv radne opreme")
                        .put("instructions", "Iz diktata izdvoji stvarni naziv opreme ili stroja. Ako korisnik kaze samo opci opis, predlozi kratak naziv za zapisnik."),
                    JSONObject().put("id", "manufacturer").put("key", "manufacturer").put("label", "Proizvodac")
                        .put("instructions", "Popuni samo ako je proizvodac izrecen ili jasno naveden u tekstu."),
                    JSONObject().put("id", "model").put("key", "model").put("label", "Tip / model")
                        .put("instructions", "Popuni tip/model ako je izrecen kao tip, model, oznaka, serija ili slicno."),
                    JSONObject().put("id", "serialNumber").put("key", "serialNumber").put("label", "Serijski broj")
                        .put("instructions", "Popuni samo ako tekst sadrzi serijski broj, SN, tvornički broj ili slicnu oznaku."),
                    JSONObject().put("id", "inventoryNumber").put("key", "inventoryNumber").put("label", "Inventarski broj")
                        .put("instructions", "Popuni samo ako tekst sadrzi inventarski broj ili inv. oznaku."),
                    JSONObject().put("id", "technicalData").put("key", "technicalData").put("label", "Tehnicki podaci")
                        .put("instructions", "Sazmi nazivni napon, snagu, tlak, kapacitet, dimenzije, radni medij, godinu, CE i slicne tehnicke podatke ako su izreceni."),
                    JSONObject().put("id", "purposeDescription").put("key", "purposeDescription").put("label", "Namjena")
                        .put("instructions", "Iz teksta zakljuci namjenu opreme jednom do dvije recenice, kao gotovu vrijednost za zapisnik."),
                    JSONObject().put("id", "workspacePosition").put("key", "workspacePosition").put("label", "Polozaj u radnom prostoru")
                        .put("instructions", "Popuni mjesto uporabe, radno mjesto, prostor, agregat, radionicu, stanicu, servisni prostor ili polozaj ako je naveden."),
                    JSONObject().put("id", "workingSubstancesAndRawMaterials").put("key", "workingSubstancesAndRawMaterials").put("label", "Radne tvari i sirovine")
                        .put("instructions", "Pisi direktno: 'Radna tvar: UNP.', 'Radni medij: stlaceni zrak.', 'Radna tvar: hidraulicno ulje.' ili slicno. Ne pisi opis tipa na fotografiji se vidi."),
                    JSONObject().put("id", "useAndMaintenance").put("key", "useAndMaintenance").put("label", "Uporaba i odrzavanje")
                        .put("instructions", "Prevedi diktat u urednu napomenu o uporabi, rukovanju, odrzavanju, komandama, zastitama i uputama."),
                    JSONObject().put("id", "methodsProceduresAndNorms").put("key", "methodsProceduresAndNorms").put("label", "Metode, postupci i norme")
                        .put("instructions", "Predlozi postupak pregleda: vizualni pregled, funkcionalna proba, provjera zastita, elektro provjera ako je oprema prikljucna."),
                    JSONObject().put("id", "deficiencies").put("key", "deficiencies").put("label", "Nedostaci")
                        .put("instructions", "Formuliraj blago. Ako tekst kaze da nema uocenih nedostataka, vrati 'Bez uocenih nedostataka.'. Ako je naveden nedostatak, preformuliraj ga tehnicki bez pretjerivanja."),
                    JSONObject().put("id", "measuresToEliminateDeficiencies").put("key", "measuresToEliminateDeficiencies").put("label", "Mjere")
                        .put("instructions", "Ako nema nedostataka, vrati 'Nisu potrebne posebne mjere.'. Ako postoje napomene, predlozi primjerenu provjeru, otklanjanje ili dokumentiranje."),
                    JSONObject().put("id", "mechanicalItems").put("key", "mechanicalItems").put("label", "Strojarski dio / ispitne stavke")
                        .put("instructions", "Vrati konkretne stavke iz diktata kao mechanicalItems. Za STROJEVI predlozak svaka izrecena provjera ili prazna stavka ide kao zaseban red s label i customContent. Za RO vrati strojarske nalaze poput stabilnosti, zastita, komandi, pokretnih dijelova, pristupa, oznaka, odrzavanja."),
                    JSONObject().put("id", "electricalItems").put("key", "electricalItems").put("label", "Elektro dio")
                        .put("instructions", "Ako tekst spominje kabel, utikac, napajanje, sklopku, tipkalo, elektromotor, napon, uzemljenje ili elektro zastitu, vrati electricalItems s konkretnim customContent."),
                    JSONObject().put("id", "riskRegisterIris").put("key", "hazardRegisterIris").put("label", "Opasnosti, stetnosti i napori")
                        .put("instructions", "Prema tekstu i vrsti opreme vrati hazardRegisterIris, harmfulnessRegisterIris i strainRegisterIris kada je sigurno. UNP/plin/gorivo ukljucuje pozar/eksploziju i kemijske stetnosti; elektricna oprema elektricnu struju; pokretni dijelovi mehanicke opasnosti; rucno pomicanje napore."),
                ),
            )
            val templateKind = if (isStrojeviTemplate) "STROJEVI" else "RO"
            val body = JSONObject()
                .put("purpose", "mobile-work-equipment-text-recognition")
                .put("dryRun", false)
                .put("modelTier", modelTier.ifBlank { "strong" })
                .put("modelPreference", JSONObject().put("tier", modelTier.ifBlank { "strong" }))
                .put("workOrderId", workOrder.id)
                .put("workOrderNumber", workOrder.displayNumber)
                .put("fields", fields)
                .put(
                    "context",
                    JSONObject()
                        .put("mode", "single-work-equipment")
                        .put("inputKind", "text-dictation")
                        .put("templateKind", templateKind)
                        .put("transcript", transcript.trim())
                        .put("companyName", workOrder.companyName)
                        .put("locationName", workOrder.locationName)
                        .put("currentEquipment", equipment.toJsonObject())
                        .put("profiles", workEquipmentRoProfilesJson())
                        .put("registers", workEquipmentRoRegisterGroupsJson())
                        .put(
                            "textRule",
                            "Ovaj tekst je diktat ili rucni unos korisnika za trenutno otvoreni stupac opreme. Ne prepisuj tekst sirovo. Pretvori ga u strukturirane vrijednosti zapisnika. Ako korisnik kaze zadovoljava/ispravno/uredno, popuni meetsConditions=true. Ako kaze ne zadovoljava/neispravno/osteceno, popuni meetsConditions=false i stavi blag, tehnicki opis u customContent, deficiencies ili mjere.",
                        )
                        .put(
                            "templateRule",
                            if (isStrojeviTemplate) {
                                "Ovo je STROJEVI/Nadzor opreme predlozak s proizvoljnim ispitnim stavkama. Glavni cilj je popuniti mechanicalItems kao redove tablice STROJEVI.2. Ako su u currentEquipment.mechanicalItems prazne stavke, dopuni ih prema diktatu. Ne stvaraj IS ZNR PDF tekst; vrati vrijednosti koje Android prikazuje u appu."
                            } else {
                                "Ovo je RO zapisnik. Popuni opisna polja, strojarski dio, elektro dio te registre opasnosti, stetnosti i napora prema diktatu i postojecim RO registrima. Ne stvaraj PDF tekst; vrati vrijednosti koje Android prikazuje u appu."
                            },
                        )
                        .put(
                            "assessmentRule",
                            "Napomena/vrijednost nije rucni uvjet ni IS ZNR blocker, ali AI preview neka vraca samo korisne mechanicalItems/electricalItems stavke. Svaka vracena stavka treba imati label i konkretan customContent do 255 znakova kada postoji siguran izvor. Ne pisi 'treba provjeriti' kao gotov nalaz; ako nesto treba potvrdu, vrati pitanje u verificationQuestions. Nedostatke i mjere formuliraj blago.",
                        ),
                )
                .put(
                    "expectedJsonShape",
                    JSONObject()
                        .put(
                            "workEquipments",
                            JSONArray().put(
                                JSONObject()
                                    .put("name", "naziv opreme")
                                    .put("manufacturer", "proizvodac")
                                    .put("model", "tip/model")
                                    .put("serialNumber", "serijski broj")
                                    .put("inventoryNumber", "inventarski broj")
                                    .put("technicalData", "kljucni tehnicki podaci")
                                    .put("purposeDescription", "namjena opreme")
                                    .put("workspacePosition", "mjesto rada / polozaj")
                                    .put("workingSubstancesAndRawMaterials", "radne tvari ili sirovine")
                                    .put("useAndMaintenance", "koristenje i odrzavanje")
                                    .put("methodsProceduresAndNorms", "metode, postupci i norme")
                                    .put("deficiencies", "nedostaci ili bez uocenih nedostataka")
                                    .put("measuresToEliminateDeficiencies", "mjere ili nisu potrebne posebne mjere")
                                    .put("finalGrade", "1 ili 0")
                                    .put("matchedSource", "izvor ako je primjenjivo")
                                    .put("confidence", "high/medium/low")
                                    .put("verificationQuestions", JSONArray().put("pitanje za korisnika kada treba potvrdu"))
                                    .put(
                                        "mechanicalItems",
                                        JSONArray().put(
                                            JSONObject()
                                                .put("registerIri", "IRI ako je siguran ili prazno")
                                                .put("label", "naziv ispitne/strojarske stavke")
                                                .put("meetsConditions", true)
                                                .put("customContent", "konkretna napomena ili vrijednost kada postoji siguran izvor")
                                                .put("measuredValue", "izmjerena vrijednost ako postoji"),
                                        ),
                                    )
                                    .put(
                                        "electricalItems",
                                        JSONArray().put(
                                            JSONObject()
                                                .put("registerIri", "IRI ako je siguran ili prazno")
                                                .put("label", "naziv elektro stavke")
                                                .put("meetsConditions", true)
                                                .put("customContent", "konkretna elektro napomena ili vrijednost kada postoji siguran izvor")
                                                .put("measuredValue", "izmjerena vrijednost ako postoji"),
                                        ),
                                    )
                                    .put("hazardRegisterIris", JSONArray().put("IRI opasnosti ako je siguran"))
                                    .put("harmfulnessRegisterIris", JSONArray().put("IRI stetnosti ako je siguran"))
                                    .put("strainRegisterIris", JSONArray().put("IRI napora ako je siguran")),
                            ),
                        )
                        .put("summary", "kratak sazetak obrade diktata"),
                )
                .toString()
            val json = JSONObject(
                request(
                    "/api/ai/openai/prepare",
                    method = "POST",
                    body = body,
                    readTimeoutMs = OPENAI_PREPARE_READ_TIMEOUT_MS,
                ),
            )
            json.toWorkEquipmentImageRecognitionResult()
        }
    }

    suspend fun recognizeWorkEquipmentAssessmentItemFromText(
        workOrder: WorkOrder,
        equipment: IsznrManualWorkEquipment,
        transcript: String,
        sectionTitle: String,
        itemLabel: String,
        registerIri: String = "",
        currentValue: String = "",
        currentMeetsConditions: Boolean = true,
        isStrojeviTemplate: Boolean = false,
        modelTier: String = "fast",
    ): Result<WorkEquipmentAssessmentVoiceResult> = withContext(Dispatchers.IO) {
        runCatching {
            val cleanTranscript = transcript.trim()
            val cleanLabel = itemLabel.trim()
            val fields = JSONArray().put(
                JSONObject()
                    .put("id", "assessmentItem")
                    .put("key", "assessmentItem")
                    .put("label", cleanLabel.ifBlank { sectionTitle.ifBlank { "Stavka" } })
                    .put(
                        "instructions",
                        "Popuni samo ovu jednu RO stavku iz diktata. Vrati gotovu napomenu/vrijednost do $RO_ASSESSMENT_NOTE_MAX_LENGTH znakova i status meetsConditions.",
                    ),
            )
            val body = JSONObject()
                .put("purpose", "mobile-work-equipment-text-recognition")
                .put("dryRun", false)
                .put("modelTier", modelTier.ifBlank { "fast" })
                .put("modelPreference", JSONObject().put("tier", modelTier.ifBlank { "fast" }))
                .put("workOrderId", workOrder.id)
                .put("workOrderNumber", workOrder.displayNumber)
                .put("fields", fields)
                .put(
                    "context",
                    JSONObject()
                        .put("mode", "assessment-item")
                        .put("inputKind", "voice-dictation")
                        .put("templateKind", if (isStrojeviTemplate) "STROJEVI" else "RO")
                        .put("sectionTitle", sectionTitle.trim())
                        .put("itemLabel", cleanLabel)
                        .put("registerIri", registerIri.trim())
                        .put("currentValue", currentValue.trim())
                        .put("currentMeetsConditions", currentMeetsConditions)
                        .put("transcript", cleanTranscript)
                        .put("companyName", workOrder.companyName)
                        .put("locationName", workOrder.locationName)
                        .put("currentEquipment", equipment.toJsonObject())
                        .put(
                            "textRule",
                            "Ovo je ultra brzi diktat za jednu stavku zapisnika. Ne mijenjaj naziv opreme ni ostala polja. Ne prepisuj sirovi tekst. Ako korisnik kaze uredno, ispravno, zadovoljava ili nema nedostataka, meetsConditions=true. Ako kaze ne zadovoljava, osteceno, neispravno ili nedostatak, meetsConditions=false. Tekst pisi strucno, kratko i blago.",
                        ),
                )
                .put(
                    "expectedJsonShape",
                    JSONObject()
                        .put(
                            "assessmentItem",
                            JSONObject()
                                .put("registerIri", "isto kao context.registerIri ako postoji")
                                .put("label", "isto kao context.itemLabel ako postoji")
                                .put("meetsConditions", true)
                                .put("customContent", "gotova napomena/vrijednost do 255 znakova")
                                .put("measuredValue", ""),
                        )
                        .put("summary", "kratko sto je upisano"),
                )
                .toString()
            val json = JSONObject(
                request(
                    "/api/ai/openai/prepare",
                    method = "POST",
                    body = body,
                    readTimeoutMs = OPENAI_PREPARE_READ_TIMEOUT_MS,
                ),
            )
            json.toWorkEquipmentAssessmentVoiceResult(
                fallbackLabel = cleanLabel,
                fallbackRegisterIri = registerIri,
                fallbackMeetsConditions = currentMeetsConditions,
            )
        }
    }

    suspend fun prepareSprVoiceMeasurementRows(
        workOrderId: String,
        workOrderNumber: String,
        template: WorkOrderDocumentationTemplate,
        voiceField: WorkOrderDocumentationField? = null,
        transcript: String,
        modelTier: String = "fast",
    ): Result<SprVoiceAiResult> = withContext(Dispatchers.IO) {
        runCatching {
            val voiceFieldText = listOfNotNull(
                voiceField?.id,
                voiceField?.key,
                voiceField?.tokenKey,
                voiceField?.label,
                voiceField?.helpText,
            )
                .joinToString(" ")
                .lowercase()
            val isEizZudsVoice = voiceFieldText.let { text ->
                text.contains("zuds") ||
                    text.contains("fid") ||
                    text.contains("rcd") ||
                    text.contains("pid") ||
                    text.contains("diferenc")
            }
            val isEizIpkVoice = !isEizZudsVoice && voiceFieldText.let { text ->
                text.contains("ipk") ||
                    text.contains("impedanc") ||
                    text.contains("petlje") ||
                    text.contains("utic") ||
                    text.contains("utič")
            }
            val isExseStaticVoice = voiceFieldText.let { text ->
                text.contains("exse1.3") ||
                    text.contains("exse 1.3") ||
                    text.contains("otpor cijevi") ||
                    text.contains("cijev") ||
                    text.contains("savitljiv") ||
                    text.contains("stati")
            }
            val table = if (template.serviceCode.equals("EIZ", ignoreCase = true)) {
                template.measurementTables.firstOrNull { table ->
                    listOf(table.id, table.key, table.tokenKey, table.label, table.summary, table.sourceSheet)
                        .joinToString(" ")
                        .lowercase()
                        .let { text ->
                            if (isEizZudsVoice) {
                                text.contains("zuds") ||
                                    text.contains("diferenc") ||
                                    text.contains("fid") ||
                                    text.contains("rcd") ||
                                    text.contains("eiz1.2")
                            } else {
                                text.contains("eiz-ipk") ||
                                    text.contains("eiz.ipk") ||
                                    text.contains("eiz1.4") ||
                                    text.contains("impedanc") ||
                                    text.contains("petlje kvara") ||
                                    (isEizIpkVoice && text.contains("ipk"))
                            }
                        }
                }
            } else if (template.serviceCode.equals("EXSE", ignoreCase = true)) {
                template.measurementTables.firstOrNull { table ->
                    listOf(table.id, table.key, table.tokenKey, table.label, table.summary, table.sourceSheet)
                        .joinToString(" ")
                        .lowercase()
                        .let { text ->
                            if (isExseStaticVoice) {
                                text.contains("exse1.3") ||
                                    text.contains("exse 1.3") ||
                                    text.contains("otpor cijevi") ||
                                    text.contains("savitljiv") ||
                                    text.contains("stati")
                            } else {
                                text.contains("exse1.2") ||
                                    text.contains("exse 1.2") ||
                                    text.contains("uzemljen") ||
                                    text.contains("otpor uzemljenja")
                            }
                        }
                } ?: template.measurementTables.getOrNull(if (isExseStaticVoice) 1 else 0)
            } else if (template.serviceCode.equals("EXEI", ignoreCase = true)) {
                template.measurementTables.firstOrNull { table ->
                    listOf(table.id, table.key, table.tokenKey, table.label, table.summary, table.sourceSheet)
                        .joinToString(" ")
                        .lowercase()
                        .let { text ->
                            if (isEizZudsVoice) {
                                text.contains("zuds") ||
                                    text.contains("diferenc") ||
                                    text.contains("fid") ||
                                    text.contains("rcd") ||
                                    text.contains("exei1.4") ||
                                    text.contains("zoi-10-08")
                            } else {
                                text.contains("exei-ipk") ||
                                    text.contains("exei1.2") ||
                                    text.contains("zoi-10-07") ||
                                    text.contains("impedanc") ||
                                    text.contains("petlje kvara") ||
                                    (isEizIpkVoice && text.contains("ipk"))
                            }
                        }
                } ?: template.measurementTables.getOrNull(if (isEizZudsVoice) 2 else 0)
            } else {
                null
            } ?: template.measurementTables.firstOrNull()
            val payload = JSONObject()
                .put("purpose", "mobile-spr-voice-measurement-rows")
                .put("workOrderId", workOrderId)
                .put("workOrderNumber", workOrderNumber)
                .put("templateId", template.id)
                .put("templateTitle", template.title)
                .put("serviceCode", template.serviceCode)
                .put("voiceFieldId", voiceField?.id.orEmpty())
                .put("voiceFieldKey", voiceField?.key.orEmpty())
                .put("voiceFieldTokenKey", voiceField?.tokenKey.orEmpty())
                .put("voiceFieldLabel", voiceField?.label.orEmpty())
                .put("transcript", transcript.trim())
                .put("modelTier", modelTier.ifBlank { "fast" })
                .put(
                    "measurementTable",
                    JSONObject()
                        .put("id", table?.id.orEmpty())
                        .put("key", table?.key.orEmpty())
                        .put("label", table?.label.orEmpty())
                        .put("sourceSheet", table?.sourceSheet.orEmpty())
                        .put("summary", table?.summary.orEmpty()),
                )
                .put(
                    "columns",
                    JSONArray((table?.sheet?.columns ?: emptyList()).mapIndexed { index, column ->
                        JSONObject()
                            .put("id", column.id)
                            .put("label", column.label)
                            .put("placeholder", column.placeholder)
                            .put("index", index)
                    }),
                )
                .toString()
            val json = JSONObject(
                request(
                    "/api/mobile/documentation/spr-voice/structure",
                    method = "POST",
                    body = payload,
                    readTimeoutMs = OPENAI_PREPARE_READ_TIMEOUT_MS,
                ),
            )
            json.toSprVoiceAiResult()
        }
    }

    suspend fun deleteWorkOrderDocument(workOrderId: String, documentId: String): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request(
                "/api/work-orders/${workOrderId.pathSegment()}/documents/${documentId.pathSegment()}",
                method = "DELETE",
            )
            Unit
        }
    }

    suspend fun downloadWorkOrderDocument(
        workOrderId: String,
        document: WorkOrderDocument,
    ): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val path = "/api/work-orders/${workOrderId.pathSegment()}/documents/${document.id.pathSegment()}/download"
            val connection = openConnection(path, method = "GET", body = null, accept = "*/*")
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti dokument (${connection.responseCode})."
                })
            }
            DownloadedDocument(
                fileName = document.fileName.ifBlank { "dokument" },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { document.fileType }
                    ?: document.fileType.ifBlank { "application/octet-stream" },
                bytes = bytes,
            )
        }
    }

    suspend fun downloadPeopleTrainingDocument(
        recordId: String,
        documentId: String,
        fallbackFileName: String,
        fallbackFileType: String,
    ): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val path = "/api/people-training-records/${recordId.pathSegment()}/documents/${documentId.pathSegment()}/download"
            val connection = openConnection(path, method = "GET", body = null, accept = "*/*")
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti dokument osposobljavanja (${connection.responseCode})."
                })
            }
            DownloadedDocument(
                fileName = parseContentDispositionFileName(connection.getHeaderField("Content-Disposition"))
                    .ifBlank { fallbackFileName.ifBlank { "osposobljavanje-dokument" } },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { fallbackFileType }
                    ?: fallbackFileType.ifBlank { "application/octet-stream" },
                bytes = bytes,
            )
        }
    }

    suspend fun downloadMobileDocument(record: MobileRecord): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val downloadPath = record.meta["downloadPath"].orEmpty().trim()
            val storageUrl = record.meta["storageUrl"].orEmpty().trim()
            val pathOrUrl = downloadPath.ifBlank { storageUrl }
            if (pathOrUrl.isBlank()) {
                throw IllegalStateException("Dokument nema dostupnu datoteku za preuzimanje.")
            }

            val connection = openBinaryDownloadConnection(pathOrUrl)
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti dokument (${connection.responseCode})."
                })
            }

            val fallbackFileName = record.meta["fileName"].orEmpty()
                .ifBlank { record.title.ifBlank { "dokument" } }
            val fallbackFileType = record.meta["fileType"].orEmpty()
                .ifBlank { guessDocumentMimeType(fallbackFileName) }

            DownloadedDocument(
                fileName = parseContentDispositionFileName(connection.getHeaderField("Content-Disposition"))
                    .ifBlank { fallbackFileName },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { fallbackFileType }
                    ?: fallbackFileType.ifBlank { "application/octet-stream" },
                bytes = bytes,
            )
        }
    }

    suspend fun downloadFieldInquiryDocument(
        inquiryId: String,
        documentId: String,
        fallbackFileName: String,
        fallbackFileType: String,
    ): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val path = "/api/mobile/field-inquiries/${inquiryId.pathSegment()}/documents/${documentId.pathSegment()}/download"
            val connection = openBinaryDownloadConnection(path)
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti dokument plana terena (${connection.responseCode})."
                })
            }

            DownloadedDocument(
                fileName = parseContentDispositionFileName(connection.getHeaderField("Content-Disposition"))
                    .ifBlank { fallbackFileName.ifBlank { "plan-terena-dokument" } },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { fallbackFileType }
                    ?: fallbackFileType.ifBlank { "application/octet-stream" },
                bytes = bytes,
            )
        }
    }

    suspend fun downloadWorkOrderPdf(workOrderId: String, fallbackFileName: String): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val path = "/api/work-orders/${workOrderId.pathSegment()}/export-pdf"
            val connection = openConnection(
                path,
                method = "POST",
                body = "{}",
                accept = "application/pdf",
                readTimeoutMs = PDF_ACTION_READ_TIMEOUT_MS,
            )
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti PDF radnog naloga (${connection.responseCode})."
                })
            }
            DownloadedDocument(
                fileName = parseContentDispositionFileName(connection.getHeaderField("Content-Disposition"))
                    .ifBlank { fallbackFileName.ifBlank { "radni-nalog.pdf" } },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { "application/pdf" }
                    ?: "application/pdf",
                bytes = bytes,
            )
        }
    }

    suspend fun downloadVehicleEvidencePdf(vehicleId: String, fallbackFileName: String): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val path = "/api/vehicles/${vehicleId.pathSegment()}/export-pdf"
            val connection = openConnection(
                path,
                method = "POST",
                body = "{}",
                accept = "application/pdf",
                readTimeoutMs = PDF_ACTION_READ_TIMEOUT_MS,
            )
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti PDF evidenciju vozila (${connection.responseCode})."
                })
            }
            DownloadedDocument(
                fileName = parseContentDispositionFileName(connection.getHeaderField("Content-Disposition"))
                    .ifBlank { fallbackFileName.ifBlank { "evidencija-vozila.pdf" } },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { "application/pdf" }
                    ?: "application/pdf",
                bytes = bytes,
            )
        }
    }

    suspend fun downloadOfferPdf(offerId: String, fallbackFileName: String): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val path = "/api/offers/${offerId.pathSegment()}/export-pdf"
            val connection = openConnection(
                path,
                method = "POST",
                body = "{}",
                accept = "application/pdf",
                readTimeoutMs = PDF_ACTION_READ_TIMEOUT_MS,
            )
            val bytes = readBinaryResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) {
                val text = bytes.toString(Charsets.UTF_8)
                throw IllegalStateException(extractErrorMessage(text).ifBlank {
                    "Ne mogu preuzeti PDF ponude (${connection.responseCode})."
                })
            }
            DownloadedDocument(
                fileName = parseContentDispositionFileName(connection.getHeaderField("Content-Disposition"))
                    .ifBlank { fallbackFileName.ifBlank { "ponuda.pdf" } },
                fileType = connection.getHeaderField("Content-Type")?.substringBefore(";")?.trim()
                    ?.ifBlank { "application/pdf" }
                    ?: "application/pdf",
                bytes = bytes,
            )
        }
    }

    suspend fun signWorkOrderPdf(
        workOrderId: String,
        signaturePngBytes: ByteArray,
        signerName: String,
        signatureLocation: String,
        signedAt: String,
        includeSignerName: Boolean,
        includeSignedAt: Boolean,
        includeSignatureLocation: Boolean,
        fallbackFileName: String,
    ): Result<DownloadedDocument> = withContext(Dispatchers.IO) {
        runCatching {
            val signatureDataUrl = "data:image/png;base64,${Base64.getEncoder().encodeToString(signaturePngBytes)}"
            val payload = JSONObject()
                .put("signatureDataUrl", signatureDataUrl)
                .put("signerName", signerName)
                .put("signatureLocation", signatureLocation)
                .put("signedAt", signedAt)
                .put("includeSignerName", includeSignerName)
                .put("includeSignedAt", includeSignedAt)
                .put("includeSignatureLocation", includeSignatureLocation)
                .toString()
            val json = JSONObject(
                request(
                    "/api/work-orders/${workOrderId.pathSegment()}/signature-pdf",
                    method = "POST",
                    body = payload,
                    readTimeoutMs = PDF_ACTION_READ_TIMEOUT_MS,
                ),
            )
            val fileContentBase64 = json.firstClean("fileContentBase64", "bytesBase64", "contentBase64")
            if (fileContentBase64.isBlank()) {
                throw IllegalStateException("Potpisani PDF nije vraćen s poslužitelja.")
            }
            DownloadedDocument(
                fileName = json.firstClean("fileName").ifBlank { fallbackFileName.ifBlank { "radni-nalog-potpisano.pdf" } },
                fileType = json.firstClean("fileType").ifBlank { "application/pdf" },
                bytes = Base64.getDecoder().decode(fileContentBase64),
            )
        }
    }

    suspend fun logout(): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            request("/api/auth/logout", method = "POST", body = "{}")
            clearSession()
            Unit
        }
    }

    private fun openConnection(
        path: String,
        method: String = "GET",
        body: String? = null,
        accept: String = "application/json",
        readTimeoutMs: Int = DEFAULT_READ_TIMEOUT_MS,
    ): HttpURLConnection {
        return (URL("$baseUrl$path").openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = DEFAULT_CONNECT_TIMEOUT_MS
            readTimeout = readTimeoutMs
            setRequestProperty("Accept", accept)
            if (accept == "application/json") {
                setRequestProperty("Accept-Encoding", "gzip")
            }
            setRequestProperty("Content-Type", "application/json; charset=utf-8")
            setRequestProperty("X-SafeNexus-Client", "android")
            if (accessToken.isNotBlank()) {
                setRequestProperty("Authorization", "Bearer $accessToken")
            }
            if (authCookieHeader.isNotBlank()) {
                setRequestProperty("Cookie", authCookieHeader)
            }
            if (body != null) {
                doOutput = true
                outputStream.use { stream ->
                    stream.write(body.toByteArray(Charsets.UTF_8))
                }
            }
        }
    }

    private fun openBinaryDownloadConnection(pathOrUrl: String): HttpURLConnection {
        val target = if (pathOrUrl.startsWith("http://", ignoreCase = true) || pathOrUrl.startsWith("https://", ignoreCase = true)) {
            pathOrUrl
        } else {
            "$baseUrl${if (pathOrUrl.startsWith("/")) pathOrUrl else "/$pathOrUrl"}"
        }
        return (URL(target).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = DEFAULT_CONNECT_TIMEOUT_MS
            readTimeout = PDF_ACTION_READ_TIMEOUT_MS
            setRequestProperty("Accept", "*/*")
            setRequestProperty("X-SafeNexus-Client", "android")
            if (accessToken.isNotBlank()) {
                setRequestProperty("Authorization", "Bearer $accessToken")
            }
            if (authCookieHeader.isNotBlank()) {
                setRequestProperty("Cookie", authCookieHeader)
            }
        }
    }

    private fun request(
        path: String,
        method: String = "GET",
        body: String? = null,
        readTimeoutMs: Int = DEFAULT_READ_TIMEOUT_MS,
        allowAuthRefresh: Boolean = true,
    ): String {
        val connection = openConnection(path, method, body, readTimeoutMs = readTimeoutMs)
        val responseText = readResponse(connection)
        rememberAuthCookies(connection)
        if (connection.responseCode == HttpURLConnection.HTTP_UNAUTHORIZED &&
            allowAuthRefresh &&
            !path.startsWith("/api/auth/login") &&
            !path.startsWith("/api/auth/refresh") &&
            refreshSessionInternal() != null
        ) {
            return request(path, method, body, readTimeoutMs, allowAuthRefresh = false)
        }
        if (connection.responseCode !in 200..299) {
            throw IllegalStateException(extractErrorMessage(responseText).ifBlank {
                "SafeNexus API trenutno nije dostupan (${connection.responseCode})."
            })
        }
        return responseText
    }

    private fun refreshSessionInternal(): SafeNexusUser? {
        if (accessToken.isBlank() && authCookieHeader.isBlank()) return null

        return runCatching {
            val connection = openConnection(
                "/api/auth/refresh",
                method = "POST",
                body = "{}",
                readTimeoutMs = DEFAULT_READ_TIMEOUT_MS,
            )
            val responseText = readResponse(connection)
            rememberAuthCookies(connection)
            if (connection.responseCode !in 200..299) return null

            val json = JSONObject(responseText)
            val refreshedMobileToken = json.optString("mobileAccessToken", "").trim()
            if (refreshedMobileToken.isNotBlank()) {
                accessToken = refreshedMobileToken
            }
            json.optJSONObject("user").toSafeNexusUser()
        }.getOrNull()
    }

    private fun rememberAuthCookies(connection: HttpURLConnection) {
        val setCookieHeaders = connection.headerFields
            .filterKeys { key -> key.equals("Set-Cookie", ignoreCase = true) }
            .values
            .flatten()

        if (setCookieHeaders.isEmpty()) return

        val current = authCookieHeader
            .split(";")
            .mapNotNull { part ->
                val trimmed = part.trim()
                val separator = trimmed.indexOf("=")
                if (separator <= 0) null else trimmed.take(separator) to trimmed.drop(separator + 1)
            }
            .toMap()
            .toMutableMap()

        setCookieHeaders.forEach { header ->
            val cookiePart = header.substringBefore(";").trim()
            val separator = cookiePart.indexOf("=")
            if (separator <= 0) return@forEach

            val name = cookiePart.take(separator)
            val value = cookiePart.drop(separator + 1)
            if (name == "safety360_access" || name == "safety360_refresh") {
                if (value.isBlank()) {
                    current.remove(name)
                } else {
                    current[name] = value
                }
            }
        }

        authCookieHeader = current.entries.joinToString("; ") { (name, value) -> "$name=$value" }
    }

    private fun readResponse(connection: HttpURLConnection): String {
        val stream = if (connection.responseCode in 200..299) {
            connection.inputStream
        } else {
            connection.errorStream ?: connection.inputStream
        }
        val decodedStream = if (connection.getHeaderField("Content-Encoding").equals("gzip", ignoreCase = true)) {
            GZIPInputStream(stream)
        } else {
            stream
        }
        return BufferedReader(InputStreamReader(decodedStream, Charsets.UTF_8)).use { reader ->
            reader.readText()
        }
    }

    private fun readBinaryResponse(connection: HttpURLConnection): ByteArray {
        val stream = if (connection.responseCode in 200..299) {
            connection.inputStream
        } else {
            connection.errorStream ?: connection.inputStream
        }
        return stream.use { it.readBytes() }
    }

    private fun extractErrorMessage(responseText: String): String = runCatching {
        val json = JSONObject(responseText)
        json.firstClean("message", "error")
    }.getOrDefault("")
}

private fun JSONObject?.toSafeNexusUser(): SafeNexusUser {
    val user = this ?: JSONObject()
    return SafeNexusUser(
        id = user.firstClean("id", "userId", "user_id"),
        displayName = user.firstClean("fullName", "displayName", "username", "email").ifBlank { "SafeNexus" },
        email = user.firstClean("email", "username"),
        profileRole = user.firstClean("profileRole", "profile_role"),
        role = user.firstClean("role"),
        clientCompanyIds = user.optJSONArray("clientCompanyIds").toStringList("id", "value"),
        clientLocationIds = user.optJSONArray("clientLocationIds").toStringList("id", "value"),
        clientAccessAllLocations = user.firstNullableBoolean("clientAccessAllLocations", "client_access_all_locations") ?: true,
    )
}

private fun String.pathSegment(): String =
    URLEncoder.encode(this, Charsets.UTF_8.name()).replace("+", "%20")

private fun IsznrRoAssessmentItem.toJsonObject(): JSONObject =
    JSONObject()
        .put("registerIri", registerIri.trim())
        .put("label", label.trim())
        .put("customContent", customContent.trim())
        .put("measuredValue", measuredValue.trim())
        .put("meetsConditions", meetsConditions)

private fun IsznrRoAttachmentFile.toJsonObject(): JSONObject =
    JSONObject()
        .put("id", id.trim())
        .put("fileName", fileName.trim())
        .put("fileType", fileType.trim())
        .put("fileSize", fileSize)
        .put("contentDataUrl", contentDataUrl.trim())
        .put("role", role.trim().ifBlank { if (fileType.startsWith("application/pdf", ignoreCase = true)) "document" else "image" })
        .put("includeInReport", includeInReport)
        .put("note", note.trim())

private val documentationWeatherPostalCityRegex = Regex("""\b\d{5}\s+([\p{L}][\p{L}\- ]{1,40})""")

private val documentationWeatherKnownCities = listOf(
    "Zagreb",
    "Rijeka",
    "Split",
    "Osijek",
    "Zadar",
    "Pula",
    "Slavonski Brod",
    "Karlovac",
    "Varaždin",
    "Šibenik",
    "Dubrovnik",
    "Sisak",
    "Vinkovci",
    "Vukovar",
    "Đakovo",
    "Požega",
    "Koprivnica",
    "Bjelovar",
    "Čakovec",
    "Sesvete",
    "Velika Gorica",
    "Samobor",
    "Zaprešić",
    "Čavle",
)

private fun guessDocumentationWeatherCity(location: String): String {
    val cleaned = location
        .replace('\n', ' ')
        .replace(Regex("\\s+"), " ")
        .trim()
    if (cleaned.isBlank()) return ""

    documentationWeatherPostalCityRegex.find(cleaned)?.groupValues?.getOrNull(1)
        ?.trim(' ', ',', ';', '.', '-')
        ?.takeIf { it.isNotBlank() }
        ?.let { return it }

    val normalizedSearch = " ${cleaned.lowercase(Locale.getDefault())} "
    documentationWeatherKnownCities.firstOrNull { city ->
        Regex("(?i)(^|[^\\p{L}])${Regex.escape(city)}([^\\p{L}]|$)").containsMatchIn(cleaned)
    }?.let { return it }

    val parts = cleaned
        .split(',', ';', '|', '·')
        .map { part ->
            part
                .replace(Regex("(?i)\\b(pm|bp|benzinska postaja|petrol|ina|tifon|crodux)\\b"), " ")
                .replace(Regex("\\b[A-Z]{1,3}\\b"), " ")
                .replace(Regex("\\s+"), " ")
                .trim(' ', '-', '.', ':')
        }
        .filter { it.length >= 3 }

    parts.firstOrNull { part -> part.any { char -> char.isLetter() } }?.let { candidate ->
        val words = candidate.split(Regex("\\s+")).filter { it.any { char -> char.isLetter() } }
        return words.take(2).joinToString(" ").ifBlank { candidate }
    }

    return normalizedSearch.trim().ifBlank { cleaned }
}

private fun JSONObject.optFiniteDouble(key: String): Double? {
    val parsed = when (val value = opt(key)) {
        is Number -> value.toDouble()
        is String -> value.trim().replace(',', '.').toDoubleOrNull()
        else -> null
    }
    return parsed?.takeIf { !it.isNaN() && !it.isInfinite() }
}

private fun formatWeatherDecimal(value: Double, suffix: String): String {
    val formatted = String.format(Locale.US, "%.1f", value)
        .removeSuffix(".0")
        .replace('.', ',')
    return "$formatted$suffix"
}

private fun localizedOpenWeatherCondition(condition: String): String =
    when (condition.lowercase(Locale.ROOT)) {
        "clear" -> "Vedro"
        "clouds" -> "Oblačno"
        "rain" -> "Kiša"
        "drizzle" -> "Slaba kiša"
        "thunderstorm" -> "Grmljavina"
        "snow" -> "Snijeg"
        "mist", "fog", "haze" -> "Magla"
        else -> ""
    }

private fun groundConditionFromOpenWeather(condition: String): String =
    when (condition.lowercase(Locale.ROOT)) {
        "rain", "drizzle", "thunderstorm" -> "Mokro"
        "snow" -> "Snijeg"
        "mist", "fog", "haze" -> "Vlažno"
        "clear", "clouds" -> "Suho"
        else -> ""
    }

private fun WorkOrderDocumentationOption.toJsonObject(): JSONObject =
    JSONObject()
        .put("id", id.trim())
        .put("label", label.trim())
        .put("subtitle", subtitle.trim())
        .put("status", status.trim())
        .put("meta", meta.toJsonObject())

private fun IsznrManualWorkEquipment.toJsonObject(): JSONObject =
    JSONObject()
        .put("name", name.trim())
        .put("manufacturer", manufacturer.trim())
        .put("model", model.trim())
        .put("serialNumber", serialNumber.trim())
        .put("inventoryNumber", inventoryNumber.trim())
        .put("note", note.trim())
        .put("technicalData", technicalData.trim())
        .put("purposeDescription", purposeDescription.trim())
        .put("workspacePosition", workspacePosition.trim())
        .put("workingSubstancesAndRawMaterials", workingSubstancesAndRawMaterials.trim())
        .put("useAndMaintenance", useAndMaintenance.trim())
        .put("methodsProceduresAndNorms", methodsProceduresAndNorms.trim())
        .put("deficiencies", deficiencies.trim())
        .put("measuresToEliminateDeficiencies", measuresToEliminateDeficiencies.trim())
        .put("finalGrade", finalGrade.trim().ifBlank { "1" })
        .put("mechanicalItems", JSONArray(mechanicalItems.map { item -> item.toJsonObject() }))
        .put("electricalItems", JSONArray(electricalItems.map { item -> item.toJsonObject() }))
        .put("hazardRegisterIris", JSONArray(hazardRegisterIris.map { iri -> iri.trim() }.filter { iri -> iri.isNotBlank() }))
        .put("harmfulnessRegisterIris", JSONArray(harmfulnessRegisterIris.map { iri -> iri.trim() }.filter { iri -> iri.isNotBlank() }))
        .put("strainRegisterIris", JSONArray(strainRegisterIris.map { iri -> iri.trim() }.filter { iri -> iri.isNotBlank() }))
        .put("attachments", JSONArray(attachments.filter { file -> file.includeInReport }.map { file -> file.toJsonObject() }))
        .put("hasParts", hasParts || parts.isNotEmpty())
        .put("parts", JSONArray(parts.map { part -> part.copy(parts = emptyList()).toJsonObject() }))

private fun IsznrManualPhysicalFactors.toJsonObject(): JSONObject =
    JSONObject()
        .put("location", location.trim())
        .put("startDate", startDate.trim())
        .put("endDate", endDate.trim())
        .put("deadlineForNextExamination", deadlineForNextExamination.trim())
        .put("technicalDocumentation", technicalDocumentation.trim())
        .put("methodsProceduresAndNorms", methodsProceduresAndNorms.trim())
        .put("workProcessConditions", workProcessConditions.trim())
        .put("airTemperature", airTemperature.trim())
        .put("relativeAirHumidity", relativeAirHumidity.trim())
        .put("airFlowSpeed", airFlowSpeed.trim())
        .put("typesOfExamination", JSONArray(typesOfExamination.map { it.trim() }.filter { it.isNotBlank() }))
        .put("spaces", JSONArray(spaces.filter { it.isReadyForIsznrPost() }.map { it.toJsonObject() }))
        .put("measurements", JSONArray(measurements.filter { it.isReadyForIsznrPost() }.map { it.toJsonObject() }))

private fun IsznrFcSpaceDraft.toJsonObject(): JSONObject =
    JSONObject()
        .put("id", id.trim())
        .put("name", name.trim())
        .put("description", description.trim())
        .put("workProcess", workProcess.trim())
        .put("workEquipment", workEquipment.trim())
        .put("finalGrade", finalGrade.trim().ifBlank { "1" })
        .put("temperatureAllowed", temperatureAllowed.trim())
        .put("temperatureMin", temperatureMin.trim())
        .put("temperatureMax", temperatureMax.trim())
        .put("humidityAllowed", humidityAllowed.trim())
        .put("humidityMin", humidityMin.trim())
        .put("humidityMax", humidityMax.trim())
        .put("airflowAllowed", airflowAllowed.trim())
        .put("airflowMin", airflowMin.trim())
        .put("airflowMax", airflowMax.trim())
        .put("illuminationAllowed", illuminationAllowed.trim())
        .put("illuminationMin", illuminationMin.trim())
        .put("illuminationMax", illuminationMax.trim())
        .put("noiseAllowed", noiseAllowed.trim())
        .put("noiseMin", noiseMin.trim())
        .put("noiseMax", noiseMax.trim())
        .put("handArmVibrationLimit", handArmVibrationLimit.trim())
        .put("handArmVibrationWarning", handArmVibrationWarning.trim())
        .put("handArmVibrationMin", handArmVibrationMin.trim())
        .put("handArmVibrationMax", handArmVibrationMax.trim())
        .put("wholeBodyVibrationLimit", wholeBodyVibrationLimit.trim())
        .put("wholeBodyVibrationWarning", wholeBodyVibrationWarning.trim())
        .put("wholeBodyVibrationMin", wholeBodyVibrationMin.trim())
        .put("wholeBodyVibrationMax", wholeBodyVibrationMax.trim())

private fun IsznrFcMeasurementDraft.toJsonObject(): JSONObject =
    JSONObject()
        .put("id", id.trim())
        .put("spaceId", spaceId.trim())
        .put("type", type.trim())
        .put("measuringPlace", measuringPlace.trim())
        .put("measuredValue", measuredValue.trim())
        .put("allowedValue", allowedValue.trim())
        .put("note", note.trim())
        .put("finalGrade", finalGrade.trim().ifBlank { "1" })

private fun IsznrFcSpaceDraft.isReadyForIsznrPost(): Boolean =
    name.trim().isNotBlank()

private fun IsznrFcMeasurementDraft.isReadyForIsznrPost(): Boolean =
    measuringPlace.trim().isNotBlank() && measuredValue.trim().isNotBlank()

private fun IsznrManualPhysicalFactors.isReadyForIsznrPost(): Boolean =
    spaces.any { it.isReadyForIsznrPost() } && measurements.any { it.isReadyForIsznrPost() }

private fun IsznrWorkEquipmentSubmitResult.toJsonObject(): JSONObject =
    JSONObject()
        .put("message", message.trim())
        .put("isznrId", isznrId.trim())
        .put("recordNumber", recordNumber.trim())
        .put("pdfUrl", pdfUrl.trim())
        .put("pdfBridgeUrl", pdfBridgeUrl.trim())
        .put("attachmentSubmitted", attachmentSubmitted)
        .put("attachmentFailed", attachmentFailed)
        .put("equipmentCount", equipmentCount)
        .put("submittedAt", submittedAt.trim())

private fun parseContentDispositionFileName(value: String?): String {
    if (value.isNullOrBlank()) return ""
    val encodedMatch = Regex("""filename\*=UTF-8''([^;]+)""", RegexOption.IGNORE_CASE).find(value)
    if (encodedMatch != null) {
        return runCatching {
            java.net.URLDecoder.decode(encodedMatch.groupValues[1], Charsets.UTF_8.name())
        }.getOrDefault("")
    }
    val plainMatch = Regex("""filename="?([^";]+)"?""", RegexOption.IGNORE_CASE).find(value)
    return plainMatch?.groupValues?.getOrNull(1)?.trim().orEmpty()
}

private fun guessDocumentMimeType(fileName: String): String {
    val extension = fileName.substringAfterLast('.', "").lowercase()
    return when (extension) {
        "pdf" -> "application/pdf"
        "doc" -> "application/msword"
        "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        "xls" -> "application/vnd.ms-excel"
        "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        "png" -> "image/png"
        "jpg", "jpeg" -> "image/jpeg"
        "webp" -> "image/webp"
        "txt" -> "text/plain"
        "html", "htm" -> "text/html"
        else -> "application/octet-stream"
    }
}

private fun JSONObject.firstClean(vararg keys: String): String {
    for (key in keys) {
        val value = optString(key, "").trim()
        if (value.isNotBlank() && value != "null") {
            return value
        }
    }
    return ""
}

private fun JSONObject.firstInt(defaultValue: Int, vararg keys: String): Int {
    for (key in keys) {
        if (!has(key) || isNull(key)) continue
        val raw = opt(key)
        val value = when (raw) {
            is Number -> raw.toInt()
            is String -> raw.trim().toIntOrNull()
            else -> null
        }
        if (value != null) return value
    }
    return defaultValue
}

private fun JSONObject.firstLong(defaultValue: Long, vararg keys: String): Long {
    for (key in keys) {
        if (!has(key) || isNull(key)) continue
        val raw = opt(key)
        val value = when (raw) {
            is Number -> raw.toLong()
            is String -> raw.trim().toLongOrNull()
            else -> null
        }
        if (value != null) return value
    }
    return defaultValue
}

private fun JSONObject.firstNullableBoolean(vararg keys: String): Boolean? {
    for (key in keys) {
        if (!has(key) || isNull(key)) continue
        val raw = opt(key)
        when (raw) {
            is Boolean -> return raw
            is Number -> return raw.toInt() != 0
            is String -> {
                val normalized = raw.trim().lowercase()
                if (normalized in setOf("true", "1", "yes", "da", "passed", "pass", "polozeno")) return true
                if (normalized in setOf("false", "0", "no", "ne", "failed", "fail", "nije_polozeno")) return false
            }
        }
    }
    return null
}

private fun JSONArray?.toStringList(vararg keys: String): List<String> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val entry = opt(index)
            val value = when (entry) {
                is JSONObject -> entry.firstClean(*keys)
                else -> entry?.toString()?.trim().orEmpty()
            }
            if (value.isNotBlank()) add(value)
        }
    }.distinct()
}

private fun JSONArray?.toIntList(): List<Int> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val entry = opt(index)
            val value = when (entry) {
                is Number -> entry.toInt()
                is String -> entry.trim().toIntOrNull()
                else -> null
            }
            if (value != null) add(value)
        }
    }
}

private fun JSONObject.firstJSONArray(vararg keys: String): JSONArray? {
    for (key in keys) {
        val value = opt(key)
        if (value is JSONArray) return value
    }
    return null
}

private fun String.toDirectRoAssessmentFinding(): String {
    var text = trim().replace(Regex("\\s+"), " ")
    RO_ASSESSMENT_PHOTO_FINDING_CLEANUPS.forEach { (regex, replacement) ->
        text = text.replace(regex, replacement)
    }
    return text
        .replace(Regex("\\s+([,.])"), "$1")
        .replace(Regex("\\.{2,}"), ".")
        .trim(' ', ',', ';', ':')
        .replaceFirstChar { char ->
            if (char.isLowerCase()) char.titlecase(Locale.getDefault()) else char.toString()
        }
}

private fun String.toRoAssessmentNote(): String =
    toDirectRoAssessmentFinding()
        .take(RO_ASSESSMENT_NOTE_MAX_LENGTH)

private fun String.toDirectRoTextField(): String =
    toDirectRoAssessmentFinding()

private fun String.toRoAiSearchText(): String =
    lowercase(Locale.ROOT)
        .replace("č", "c")
        .replace("ć", "c")
        .replace("š", "s")
        .replace("ž", "z")
        .replace("đ", "d")

private fun normalizeRoWorkingSubstances(value: String, vararg contextParts: String): String {
    val direct = value.toDirectRoTextField()
    val searchText = (listOf(direct) + contextParts)
        .joinToString(" ")
        .toRoAiSearchText()
    val directSearch = direct.toRoAiSearchText()
    val isGenericPhotoText = directSearch.contains("spremnik") ||
        directSearch.contains("posuda") ||
        directSearch.contains("uredaj") ||
        directSearch.contains("oprema")
    return when {
        searchText.contains("unp") ||
            searchText.contains("lpg") ||
            searchText.contains("propan") ||
            searchText.contains("butan") ||
            searchText.contains("ukapljeni naftni plin") ->
            if (direct.isBlank() || isGenericPhotoText || !directSearch.contains("radna tvar")) "Radna tvar: UNP." else direct
        searchText.contains("kompresor") ||
            searchText.contains("stlaceni zrak") ||
            searchText.contains("stlačeni zrak") ->
            if (direct.isBlank() || isGenericPhotoText || !directSearch.contains("medij")) "Radni medij: stlaceni zrak." else direct
        searchText.contains("hidraulic") || searchText.contains("ulje") ->
            if (direct.isBlank() || isGenericPhotoText) "Radna tvar: hidraulicno ulje." else direct
        searchText.contains("gorivo") ||
            searchText.contains("dizel") ||
            searchText.contains("diesel") ||
            searchText.contains("benzin") ->
            if (direct.isBlank() || isGenericPhotoText) "Radna tvar: gorivo." else direct
        searchText.contains("elektricna energija") || searchText.contains("elektricka energija") ->
            if (direct.isBlank() || isGenericPhotoText) "Elektricna energija." else direct
        else -> direct
    }
}

private fun normalizeRoDeficienciesText(value: String): String {
    val direct = value.toDirectRoTextField()
    if (direct.isBlank()) return direct
    return direct
        .replace(Regex("\\bzabraniti\\s+rad\\b", RegexOption.IGNORE_CASE), "preporucuje se ograniciti uporabu do provjere")
        .replace(Regex("\\bopasno\\s+stanje\\b", RegexOption.IGNORE_CASE), "stanje za dodatnu provjeru")
        .replace(Regex("\\bkritic(?:an|no|na|ni)\\b", RegexOption.IGNORE_CASE), "za dodatnu provjeru")
}

private fun normalizeRoMeasuresText(value: String): String =
    normalizeRoDeficienciesText(value)

private fun JSONArray?.toRoAssessmentItems(): List<IsznrRoAssessmentItem> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            when (val entry = opt(index)) {
                is JSONObject -> {
                    val status = entry.firstClean("status", "grade", "result").lowercase(Locale.getDefault())
                    val label = entry.firstClean("label", "name", "title", "item", "stavka", "description")
                    val registerIri = entry.firstClean("registerIri", "iri", "@id", "register", "id", "isznrId")
                    val customContent = entry.firstClean(
                        "customContent",
                        "note",
                        "napomena",
                        "value",
                        "vrijednost",
                        "comment",
                        "reason",
                        "observedCondition",
                        "finding",
                    )
                    val rawMeasuredValue = entry.firstClean("measuredValue", "measurement", "measured", "izmjerenaVrijednost")
                    val rawNoteValue = customContent.ifBlank { rawMeasuredValue }.toRoAssessmentNote()
                    val noteValue = if (isRoAssessmentUnverifiedNote(rawNoteValue)) "" else rawNoteValue
                    val measuredValue = if (rawMeasuredValue.isNotBlank() && rawMeasuredValue != noteValue && !isRoAssessmentUnverifiedNote(rawMeasuredValue)) {
                        rawMeasuredValue.toRoAssessmentNote()
                    } else {
                        ""
                    }
                    val meetsConditions = entry.firstNullableBoolean("meetsConditions", "satisfactory", "zadovoljava", "isOk")
                        ?: !status.contains("ne zadovoljava")
                    val item = IsznrRoAssessmentItem(
                        registerIri = registerIri,
                        label = label,
                        customContent = noteValue,
                        measuredValue = measuredValue,
                        meetsConditions = meetsConditions,
                    )
                    if (listOf(item.customContent, item.measuredValue).any { it.isNotBlank() }) {
                        add(item)
                    }
                }
                else -> {
                    val text = entry?.toString()?.trim().orEmpty().toRoAssessmentNote()
                    if (text.isNotBlank()) {
                        add(IsznrRoAssessmentItem(label = text, customContent = text))
                    }
                }
            }
        }
    }
        .distinctBy { item ->
            listOf(item.registerIri, item.label, item.customContent)
                .joinToString("|")
                .lowercase(Locale.getDefault())
        }
        .take(120)
}

private fun roVerificationQuestion(label: String, note: String): String {
    val normalizedLabel = label.trim()
    val normalizedNote = note.toRoAssessmentNote()
    return when {
        normalizedLabel.isNotBlank() && normalizedNote.isNotBlank() -> "Potvrdi stavku \"$normalizedLabel\": $normalizedNote"
        normalizedLabel.isNotBlank() -> "Potvrdi stavku \"$normalizedLabel\" prije upisa u zapisnik."
        normalizedNote.isNotBlank() -> "Potvrdi nalaz: $normalizedNote"
        else -> ""
    }
}

private fun JSONArray?.toRoVerificationQuestionsFromAssessmentItems(): List<String> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val entry = opt(index)
            val question = when (entry) {
                is JSONObject -> {
                    val label = entry.firstClean("label", "name", "title", "item", "stavka", "description")
                    val note = entry.firstClean(
                        "customContent",
                        "note",
                        "napomena",
                        "value",
                        "vrijednost",
                        "comment",
                        "reason",
                        "observedCondition",
                        "finding",
                        "measuredValue",
                        "measurement",
                    )
                    if (isRoAssessmentUnverifiedNote(note)) roVerificationQuestion(label, note) else ""
                }
                else -> {
                    val note = entry?.toString()?.trim().orEmpty()
                    if (isRoAssessmentUnverifiedNote(note)) roVerificationQuestion("", note) else ""
                }
            }
            if (question.isNotBlank()) add(question)
        }
    }.distinct()
}

private fun JSONObject.roVerificationQuestions(): List<String> =
    (
        optJSONArray("verificationQuestions").toStringList("question", "label", "text") +
            optJSONArray("userQuestions").toStringList("question", "label", "text") +
            optJSONArray("manualConfirmationQuestions").toStringList("question", "label", "text") +
            optJSONArray("questionsForUser").toStringList("question", "label", "text") +
            optJSONArray("mechanicalItems").toRoVerificationQuestionsFromAssessmentItems() +
            optJSONArray("roMechanicalItems").toRoVerificationQuestionsFromAssessmentItems() +
            optJSONArray("electricalItems").toRoVerificationQuestionsFromAssessmentItems() +
            optJSONArray("roElectricalItems").toRoVerificationQuestionsFromAssessmentItems()
        )
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .distinct()
        .take(40)

private fun JSONObject.roAssessmentItems(vararg keys: String): List<IsznrRoAssessmentItem> =
    firstJSONArray(*keys).toRoAssessmentItems()

private fun JSONObject.toWorkEquipmentAssessmentVoiceResult(
    fallbackLabel: String = "",
    fallbackRegisterIri: String = "",
    fallbackMeetsConditions: Boolean = true,
): WorkEquipmentAssessmentVoiceResult {
    val root = this
    val outputObject = parseJsonObject(root.firstClean("outputText"))
    val result = root.optJSONObject("result")
        ?: outputObject?.optJSONObject("result")
        ?: outputObject
        ?: root
    val itemObject = result.optJSONObject("assessmentItem")
        ?: result.optJSONObject("item")
        ?: result.optJSONArray("assessmentItems")?.optJSONObject(0)
        ?: result.optJSONArray("items")?.optJSONObject(0)
        ?: result.optJSONArray("mechanicalItems")?.optJSONObject(0)
        ?: result.optJSONArray("electricalItems")?.optJSONObject(0)
        ?: result.optJSONArray("workEquipments")?.optJSONObject(0)?.let { equipment ->
            equipment.optJSONArray("mechanicalItems")?.optJSONObject(0)
                ?: equipment.optJSONArray("electricalItems")?.optJSONObject(0)
        }
    val parsedItem = itemObject?.let { JSONArray().put(it).toRoAssessmentItems().firstOrNull() }
    val directValue = result.firstClean(
        "customContent",
        "value",
        "note",
        "napomena",
        "vrijednost",
        "text",
        "content",
    ).toRoAssessmentNote()
    val status = result.firstClean("status", "grade", "result").lowercase(Locale.getDefault())
    val directMeets = result.firstNullableBoolean("meetsConditions", "satisfactory", "zadovoljava", "isOk")
        ?: !status.contains("ne zadovoljava")
    val fallbackItem = IsznrRoAssessmentItem(
        registerIri = fallbackRegisterIri.trim(),
        label = fallbackLabel.trim(),
        customContent = directValue,
        measuredValue = "",
        meetsConditions = directMeets,
    )
    val item = (parsedItem ?: fallbackItem).let { candidate ->
        candidate.copy(
            registerIri = candidate.registerIri.ifBlank { fallbackRegisterIri.trim() },
            label = candidate.label.ifBlank { fallbackLabel.trim() },
            customContent = candidate.customContent.ifBlank { directValue }.toRoAssessmentNote(),
            measuredValue = candidate.measuredValue.toRoAssessmentNote(),
            meetsConditions = parsedItem?.meetsConditions ?: directMeets.takeIf { directValue.isNotBlank() } ?: fallbackMeetsConditions,
        )
    }
    return WorkEquipmentAssessmentVoiceResult(
        item = item,
        message = result.firstClean("summary", "message")
            .ifBlank { root.firstClean("nextStep", "message") }
            .ifBlank { outputObject?.firstClean("summary", "message").orEmpty() },
    )
}

private fun JSONObject.roIriList(vararg keys: String): List<String> =
    keys.flatMap { key -> optJSONArray(key).toStringList("registerIri", "iri", "@id", "id", "value", "label", "name") }
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .distinct()
        .take(120)

private fun JSONObject?.toDashboardStats(): DashboardStats {
    if (this == null) return DashboardStats()
    return DashboardStats(
        workOrdersTotal = optInt("workOrdersTotal", 0),
        activeWorkOrders = optInt("activeWorkOrders", 0),
        overdueWorkOrders = optInt("overdueWorkOrders", 0),
        closedWorkOrders = optInt("closedWorkOrders", 0),
        vehiclesTotal = optInt("vehiclesTotal", 0),
        reservationsTotal = optInt("reservationsTotal", 0),
        documentsTotal = optInt("documentsTotal", 0),
        trainingsTotal = optInt("trainingsTotal", 0),
        clientPortalTotal = optInt("clientPortalTotal", 0),
        rulebooksTotal = optInt("rulebooksTotal", 0),
        riskAssessmentsTotal = optInt("riskAssessmentsTotal", 0),
        measurementEquipmentTotal = optInt("measurementEquipmentTotal", 0),
    )
}

private fun JSONObject?.toClientHomeSummary(): ClientHomeSummary {
    if (this == null) return ClientHomeSummary()
    return ClientHomeSummary(
        title = optString("title", "").trim(),
        subtitle = optString("subtitle", "").trim(),
        companiesTotal = optInt("companiesTotal", 0),
        locationsTotal = optInt("locationsTotal", 0),
        workOrdersTotal = optInt("workOrdersTotal", 0),
        activeWorkOrders = optInt("activeWorkOrders", 0),
        documentsTotal = optInt("documentsTotal", 0),
        trainingsTotal = optInt("trainingsTotal", 0),
        riskAssessmentsTotal = optInt("riskAssessmentsTotal", 0),
        latestWorkOrders = optJSONArray("latestWorkOrders").toWorkOrders(),
    )
}

private fun JSONObject?.toStringMap(): Map<String, String> {
    if (this == null) return emptyMap()
    return buildMap {
        keys().forEach { key ->
            val value = opt(key)
            if (value != null && value != JSONObject.NULL) {
                val text = value.toString().trim()
                if (text.isNotBlank() && text != "null") {
                    put(key, text)
                }
            }
        }
    }
}

private fun JSONObject?.toNestedStringMap(): Map<String, Map<String, String>> {
    if (this == null) return emptyMap()
    return buildMap {
        keys().forEach { key ->
            val values = optJSONObject(key).toStringMap()
            if (values.isNotEmpty()) {
                put(key, values)
            }
        }
    }
}

private fun Map<String, String>.toJsonObject(): JSONObject {
    val json = JSONObject()
    forEach { (key, value) -> json.put(key, value) }
    return json
}

private fun ClientPortalRecordDraft.toJsonPayload(): String =
    JSONObject()
        .put("companyId", companyId.trim())
        .put("locationId", locationId.trim())
        .put("type", type.trim())
        .put("status", status.trim().ifBlank { "active" })
        .put("details", details.toJsonObject())
        .toString()

private fun Map<String, Map<String, String>>.toNestedJsonObject(): JSONObject {
    val json = JSONObject()
    forEach { (key, values) -> json.put(key, values.toJsonObject()) }
    return json
}

private fun FieldInquiryDraft.toJsonPayload(): String =
    JSONObject()
        .put("title", title)
        .put("status", status)
        .put("plannedDate", plannedDate)
        .put("timeFrom", timeFrom)
        .put("timeTo", timeTo)
        .put("companyId", companyId)
        .put("locationId", locationId)
        .put("workOrderId", workOrderId)
        .put("vehicleId", vehicleId)
        .put("contactName", contactName)
        .put("contactPhone", contactPhone)
        .put("serviceLine", serviceLine)
        .put("note", note)
        .put("assignedUserIds", JSONArray(assignedUserIds))
        .put("assignedUserLabels", JSONArray(assignedUserLabels))
        .put("syncWorkOrderExecutionDate", syncWorkOrderExecutionDate)
        .also { json ->
            documents?.let { docs ->
                json.put("documents", JSONArray(docs.map { it.toJsonObject() }))
            }
        }
        .toString()

private fun FieldInquiryDocumentDraft.toJsonObject(): JSONObject =
    JSONObject()
        .put("id", id)
        .put("fileName", fileName)
        .put("fileType", fileType)
        .put("fileSize", fileSize)
        .put("documentCategory", documentCategory)
        .put("description", description)
        .put("dataUrl", dataUrl)

private fun JobCreateDraft.toJsonPayload(): String =
    JSONObject()
        .put("title", title.trim())
        .put("status", status.ifBlank { "draft" })
        .put("description", description.trim())
        .put("environment", JSONObject())
        .put("conditions", JSONObject())
        .put("hazards", JSONArray())
        .put("ppeItems", JSONArray())
        .toString()

private fun riskTextListJson(value: String): JSONArray {
    val items = value
        .split("\n", ";", ",")
        .map { it.trim() }
        .filter { it.isNotBlank() }
    return JSONArray(items)
}

private fun RiskAssessmentCreateDraft.toJsonPayload(): String {
    val jobArray = JSONArray()
    jobs.forEachIndexed { index, job ->
        val riskRows = JSONArray()
        job.riskRows.forEach { risk ->
            riskRows.put(
                JSONObject()
                    .put("hazard", risk.hazard.trim())
                    .put("source", risk.source.trim())
                    .put("possibleConsequences", risk.possibleConsequences.trim())
                    .put("riskLevel", risk.riskLevel.trim())
                    .put("existingMeasures", risk.existingMeasures.trim())
                    .put("additionalMeasures", risk.additionalMeasures.trim())
                    .put("measures", risk.measures.trim()),
            )
        }

        val ppeItems = JSONArray()
        job.ppeItems.forEach { ppe ->
            ppeItems.put(
                JSONObject()
                    .put("name", ppe.name.trim())
                    .put("category", ppe.category.trim())
                    .put("norm", ppe.norm.trim())
                    .put("description", ppe.description.trim())
                    .put("required", true)
                    .put("mandatory", true),
            )
        }

        jobArray.put(
            JSONObject()
                .put("id", "mobile-job-${System.currentTimeMillis()}-$index")
                .put("sourceJobIds", JSONArray(listOf(job.sourceJobId).filter { it.isNotBlank() }))
                .put("status", "draft")
                .put("jobTitle", job.jobTitle.trim())
                .put("shortDescription", job.description.trim().take(220))
                .put("description", job.description.trim())
                .put("tasks", job.tasks.trim())
                .put("workerCount", job.workerCount.trim())
                .put("workplace", job.workplace.trim())
                .put("workSchedule", job.workSchedule.trim())
                .put("workOrganization", job.workOrganization.trim())
                .put("workEnvironment", job.workEnvironment.trim())
                .put("workEquipment", job.workEquipment.trim())
                .put("toolsAndMachines", job.toolsAndMachines.trim())
                .put("workSubstances", job.workSubstances.trim())
                .put("trainings", job.trainings.trim())
                .put("medicalExams", job.medicalExams.trim())
                .put("ppeText", job.ppeText.trim())
                .put("note", job.note.trim())
                .put("riskRows", riskRows)
                .put("ppeItems", ppeItems),
        )
    }

    val organizationUnitArray = JSONArray()
    organizationUnits.forEachIndexed { index, unit ->
        organizationUnitArray.put(
            JSONObject()
                .put("type", unit.type.ifBlank { "workplace" })
                .put("order", index + 1)
                .put("name", unit.name.trim())
                .put("responsiblePerson", unit.responsiblePerson.trim())
                .put("workerCount", unit.workerCount.trim())
                .put("description", unit.description.trim()),
        )
    }

    val measureArray = JSONArray()
    measures.forEachIndexed { index, measure ->
        measureArray.put(
            JSONObject()
                .put("order", index + 1)
                .put("measure", measure.measure.trim())
                .put("deadline", measure.deadline.trim())
                .put("responsiblePerson", measure.responsiblePerson.trim())
                .put("controlMethod", measure.controlMethod.trim())
                .put("status", measure.status.ifBlank { "open" }),
        )
    }

    val manualHandlingArray = JSONArray()
    manualHandling.forEachIndexed { index, item ->
        manualHandlingArray.put(
            JSONObject()
                .put("order", index + 1)
                .put("activity", item.activity.trim())
                .put("jobId", "")
                .put("jobTitle", item.jobTitle.trim())
                .put("loadWeightKg", item.loadWeightKg.trim())
                .put("transfersPerHour", item.transfersPerHour.trim())
                .put("carryingDistanceMeters", item.carryingDistanceMeters.trim())
                .put("posture", item.posture.ifBlank { "upright" })
                .put("workConditions", item.workConditions.ifBlank { "good" })
                .put("note", item.note.trim()),
        )
    }

    val chemicalArray = JSONArray()
    chemicals.forEachIndexed { index, chemical ->
        chemicalArray.put(
            JSONObject()
                .put("order", index + 1)
                .put("name", chemical.name.trim())
                .put("casNumber", chemical.casNumber.trim())
                .put("classification", chemical.classification.trim())
                .put("hazardStatements", riskTextListJson(chemical.hazardStatements))
                .put("ppe", chemical.ppe.trim())
                .put("storage", chemical.storage.trim())
                .put("note", chemical.note.trim()),
        )
    }

    val biologicalArray = JSONArray()
    biologicalRisks.forEachIndexed { index, biological ->
        biologicalArray.put(
            JSONObject()
                .put("order", index + 1)
                .put("agentName", biological.agentName.trim())
                .put("category", biological.category.trim())
                .put("group", biological.group.trim())
                .put("source", biological.source.trim())
                .put("possibleConsequences", biological.possibleConsequences.trim())
                .put("existingMeasures", biological.existingMeasures.trim())
                .put("note", biological.note.trim()),
        )
    }

    val titleValue = title.trim().ifBlank {
        listOf(companyName, "Procjena rizika").filter { it.isNotBlank() }.joinToString(" - ")
    }
    val employerData = JSONObject()
        .put("fullName", employerFullName.trim().ifBlank { companyName })
        .put("address", employerAddress.trim())
        .put("mbs", employerMbs.trim())
        .put("oib", employerOib.trim())
        .put("nkdActivity", employerNkdActivity.trim())
        .put("employeeCount", employerEmployeeCount.trim())
        .put("headquarters", employerHeadquarters.trim())
        .put("detachedLocations", employerDetachedLocations.trim())
        .put("locationScope", if (locationId.isBlank()) "all" else "selected")
        .put("selectedLocationIds", JSONArray(listOf(locationId).filter { it.isNotBlank() }))
        .put("znrServiceMode", znrServiceMode.trim())
        .put("znrExperts", znrExperts.trim())
        .put("znrRepresentatives", znrRepresentatives.trim())
        .put("znrCommitteeParticipation", znrCommitteeParticipation.trim())
        .put("assessmentMembers", collaborators.trim())

    return JSONObject()
        .put("companyId", companyId)
        .put("companyName", companyName)
        .put("locationId", locationId)
        .put("locationName", locationName)
        .put("workOrderId", workOrderId)
        .put("workOrderNumber", workOrderNumber)
        .put("status", status.ifBlank { "draft" })
        .put("title", titleValue)
        .put("assessmentNumber", assessmentNumber)
        .put("assessmentType", "Procjena rizika")
        .put("assessmentDate", assessmentDate)
        .put("revisionDate", revisionDate)
        .put("completionDate", completionDate.ifBlank { assessmentDate })
        .put("teamLead", teamLead.trim())
        .put("collaborators", collaborators.trim())
        .put("employerData", employerData)
        .put("intro", intro.trim())
        .put("workProcessDescription", workProcessDescription.trim())
        .put("generalData", generalData.trim())
        .put("computerWorkplaces", computerWorkplaces.trim())
        .put("basicRules", basicRules.trim())
        .put("specialRules", specialRules.trim())
        .put("omissionsBasic", omissionsBasic.trim())
        .put("omissionsSpecial", omissionsSpecial.trim())
        .put("conclusion", conclusion.trim())
        .put("biologicalHazards", biologicalHazards.trim())
        .put("clientNote", clientNote.trim())
        .put("clientJobInputEnabled", clientJobInputEnabled)
        .put("jobs", jobArray)
        .put("organizationUnits", organizationUnitArray)
        .put("measures", measureArray)
        .put("manualHandling", manualHandlingArray)
        .put("chemicals", chemicalArray)
        .put("biologicalRisks", biologicalArray)
        .toString()
}

private fun WorkOrderMeasurementSheet.toJsonObject(): JSONObject {
    val columnArray = JSONArray()
    columns.forEach { column ->
        columnArray.put(
            JSONObject()
                .put("id", column.id)
                .put("label", column.label)
                .put("placeholder", column.placeholder)
                .put("width", column.width)
                .put("computed", if (column.computed.isBlank()) JSONObject.NULL else column.computed)
                .put("readonly", column.readonly),
        )
    }
    val rowArray = JSONArray()
    rows.forEach { row ->
        rowArray.put(
            JSONObject()
                .put("id", row.id)
                .put("cells", row.cells.toJsonObject())
                .put("formats", row.formats.toMeasurementFormatsJsonObject()),
        )
    }
    val mergeArray = JSONArray()
    merges.forEach { merge ->
        mergeArray.put(
            JSONObject()
                .put("rowId", merge.rowId)
                .put("columnId", merge.columnId)
                .put("rowSpan", merge.rowSpan)
                .put("colSpan", merge.colSpan),
        )
    }
    val headerArray = JSONArray()
    headerRows.forEach { headerArray.put(it) }
    return JSONObject()
        .put("columns", columnArray)
        .put("rows", rowArray)
        .put("merges", mergeArray)
        .put("headerRows", headerArray)
        .put("pageOrientation", pageOrientation)
}

private fun Map<String, WorkOrderMeasurementSheet>.toMeasurementSheetJsonObject(): JSONObject {
    val json = JSONObject()
    forEach { (key, sheet) -> json.put(key, sheet.toJsonObject()) }
    return json
}

private fun Map<String, Map<String, WorkOrderMeasurementSheet>>.toNestedMeasurementSheetJsonObject(): JSONObject {
    val json = JSONObject()
    forEach { (key, values) -> json.put(key, values.toMeasurementSheetJsonObject()) }
    return json
}

private fun Map<String, JSONObject>.toMeasurementFormatsJsonObject(): JSONObject {
    val json = JSONObject()
    forEach { (key, value) -> json.put(key, value) }
    return json
}

private fun List<WorkOrderDocumentationAiFile>.toDocumentationAiFilesJsonArray(): JSONArray =
    JSONArray().also { array ->
        forEach { file ->
            array.put(
                JSONObject()
                    .put("id", file.id)
                    .put("name", file.name)
                    .put("fileName", file.name)
                    .put("type", file.type)
                    .put("fileType", file.type)
                    .put("size", file.size)
                    .put("fileSize", file.size)
                    .put("sourceKind", file.sourceKind)
                    .put("sourceKindLabel", file.sourceKindLabel)
                    .put("dataUrl", file.contentDataUrl)
                    .put("contentDataUrl", file.contentDataUrl),
            )
        }
    }

private fun Map<String, List<WorkOrderDocumentationAiFile>>.toNestedDocumentationAiFilesJsonObject(): JSONObject =
    JSONObject().also { json ->
        forEach { (key, files) ->
            val normalizedKey = key.trim()
            if (normalizedKey.isNotBlank() && files.isNotEmpty()) {
                json.put(normalizedKey, files.toDocumentationAiFilesJsonArray())
            }
        }
    }

private fun JSONArray?.toWorkOrderDocumentationAiFiles(): List<WorkOrderDocumentationAiFile> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val name = item.firstClean("name", "fileName").ifBlank { "Prilog ${index + 1}" }
            val contentDataUrl = item.firstClean("contentDataUrl", "dataUrl")
            if (name.isBlank() || contentDataUrl.isBlank()) continue
            add(
                WorkOrderDocumentationAiFile(
                    id = item.firstClean("id").ifBlank { "saved-attachment-${index + 1}-${name.hashCode()}" },
                    name = name,
                    type = item.firstClean("type", "fileType").ifBlank { "application/octet-stream" },
                    size = item.firstLong(0L, "size", "fileSize"),
                    contentDataUrl = contentDataUrl,
                    sourceKind = item.firstClean("sourceKind"),
                    sourceKindLabel = item.firstClean("sourceKindLabel"),
                ),
            )
        }
    }.distinctBy { it.id }
}

private fun JSONObject?.toWorkOrderDocumentationAiFileMap(): Map<String, List<WorkOrderDocumentationAiFile>> {
    if (this == null) return emptyMap()
    return buildMap {
        val keys = keys()
        while (keys.hasNext()) {
            val key = keys.next().trim()
            if (key.isBlank()) continue
            val files = optJSONArray(key).toWorkOrderDocumentationAiFiles()
            if (files.isNotEmpty()) {
                put(key, files)
            }
        }
    }
}

private fun List<WorkOrderDocumentationAiField>.toDocumentationAiFieldsJsonArray(): JSONArray =
    JSONArray().also { array ->
        forEach { field ->
            val rows = JSONArray()
            field.systemRows.forEach { row ->
                rows.put(
                    JSONObject()
                        .put("id", row.id)
                        .put("subtitle", row.subtitle)
                        .put("lineCount", row.lineCount)
                        .put("placeholder", row.placeholder),
                )
            }
            array.put(
                JSONObject()
                    .put("id", field.id)
                    .put("key", field.key)
                    .put("label", field.label)
                    .put("type", field.type)
                    .put("fieldType", field.fieldType)
                    .put("required", field.required)
                    .put("ai", field.ai)
                    .put("valueShape", field.valueShape)
                    .put("sectionSubtitle", field.sectionSubtitle)
                    .put("systemRows", rows),
            )
        }
    }

private fun List<WorkOrderDocumentationAiMeasurementColumn>.toDocumentationAiColumnsJsonArray(): JSONArray =
    JSONArray().also { array ->
        forEach { column ->
            array.put(
                JSONObject()
                    .put("fieldId", column.fieldId)
                    .put("fieldKey", column.fieldKey)
                    .put("fieldLabel", column.fieldLabel)
                    .put("fieldDescription", column.fieldDescription)
                    .put("columnId", column.columnId)
                    .put("columnIndex", column.columnIndex)
                    .put("columnLetter", column.columnLetter)
                    .put("key", column.key)
                    .put("label", column.label)
                    .put("type", column.type)
                    .put("required", column.required)
                    .put("placeholder", column.placeholder)
                    .put("helpText", column.helpText)
                    .put("aiMapping", column.aiMapping),
            )
        }
    }

private fun JSONArray?.toDocumentationFieldOptions(): List<OptionItem> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = opt(index)
            if (item is JSONObject) {
                val value = item.firstClean("value", "id", "key", "label")
                val label = item.firstClean("label", "name", "title", "value").ifBlank { value }
                if (value.isNotBlank() || label.isNotBlank()) {
                    add(OptionItem(value.ifBlank { label }, label.ifBlank { value }))
                }
            } else {
                val value = item?.toString()?.trim().orEmpty()
                if (value.isNotBlank() && value != "null") {
                    add(OptionItem(value, value))
                }
            }
        }
    }.distinctBy { it.value }
}

private fun JSONArray?.toWorkOrderDocumentationFields(): List<WorkOrderDocumentationField> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderDocumentationField(
                    id = item.firstClean("id"),
                    key = item.firstClean("key"),
                    tokenKey = item.firstClean("tokenKey"),
                    label = item.firstClean("label").ifBlank { "Polje" },
                    type = item.firstClean("type").ifBlank { "text" },
                    required = item.optBoolean("required", false),
                    helpText = item.firstClean("helpText"),
                    defaultValue = item.firstClean("defaultValue"),
                    options = item.optJSONArray("options").toDocumentationFieldOptions(),
                    signatureArea = item.firstClean("signatureArea"),
                    signatureRole = item.firstClean("signatureRole"),
                    signatureMultiple = item.optBoolean("signatureMultiple", true),
                    signatureMetaFields = item.optJSONArray("signatureMetaFields").toStringList(),
                ),
            )
        }
    }.filter { it.id.isNotBlank() || it.key.isNotBlank() || it.tokenKey.isNotBlank() }
}

private fun JSONArray?.toWorkOrderDocumentationTemplateBlocks(): List<WorkOrderDocumentationTemplateBlock> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val id = item.firstClean("id", "key", "tokenKey")
            val label = item.firstClean("label", "typeLabel", "key").ifBlank { id }
            if (id.isNotBlank() && label.isNotBlank()) {
                add(
                    WorkOrderDocumentationTemplateBlock(
                        id = id,
                        key = item.firstClean("key"),
                        tokenKey = item.firstClean("tokenKey"),
                        label = label,
                        type = item.firstClean("type").ifBlank { "text" },
                        typeLabel = item.firstClean("typeLabel").ifBlank { item.firstClean("type").ifBlank { "Polje" } },
                        group = item.firstClean("group").ifBlank { "Predložak" },
                        required = item.optBoolean("required", false),
                        editable = item.optBoolean("editable", false),
                        helpText = item.firstClean("helpText"),
                        summary = item.firstClean("summary"),
                        options = item.optJSONArray("options").toDocumentationFieldOptions(),
                        signatureArea = item.firstClean("signatureArea"),
                        signatureRole = item.firstClean("signatureRole"),
                        signatureMultiple = item.optBoolean("signatureMultiple", true),
                        signatureMetaFields = item.optJSONArray("signatureMetaFields").toStringList(),
                    ),
                )
            }
        }
    }.distinctBy { "${it.id}::${it.type}" }
}

private fun JSONArray?.toWorkOrderMeasurementColumns(): List<WorkOrderMeasurementColumn> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val id = item.firstClean("id").ifBlank { "measurement-column-${index + 1}" }
            add(
                WorkOrderMeasurementColumn(
                    id = id,
                    label = item.firstClean("label").ifBlank { "Kolona ${index + 1}" },
                    placeholder = item.firstClean("placeholder"),
                    width = item.optInt("width", 140).coerceIn(60, 260),
                    computed = item.firstClean("computed"),
                    readonly = item.optBoolean("readonly", false),
                ),
            )
        }
    }.filter { it.id.isNotBlank() && it.label.isNotBlank() }
}

private fun JSONArray?.toWorkOrderMeasurementRows(columns: List<WorkOrderMeasurementColumn>): List<WorkOrderMeasurementRow> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val sourceCells = item.optJSONObject("cells").toStringMap()
            val cells = columns.associate { column -> column.id to sourceCells[column.id].orEmpty() }
            val sourceFormats = item.optJSONObject("formats").toMeasurementFormatMap()
            add(
                WorkOrderMeasurementRow(
                    id = item.firstClean("id").ifBlank { "measurement-row-${index + 1}" },
                    cells = cells,
                    formats = sourceFormats,
                ),
            )
        }
    }
}

private fun JSONObject?.toMeasurementFormatMap(): Map<String, JSONObject> {
    if (this == null) return emptyMap()
    return buildMap {
        keys().forEach { key ->
            put(key, optJSONObject(key) ?: JSONObject())
        }
    }
}

private fun JSONArray?.toWorkOrderMeasurementMerges(): List<WorkOrderMeasurementMerge> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderMeasurementMerge(
                    rowId = item.firstClean("rowId"),
                    columnId = item.firstClean("columnId"),
                    rowSpan = item.optInt("rowSpan", 1).coerceAtLeast(1),
                    colSpan = item.optInt("colSpan", 1).coerceAtLeast(1),
                ),
            )
        }
    }.filter { it.rowId.isNotBlank() && it.columnId.isNotBlank() }
}

private fun JSONObject?.toWorkOrderMeasurementSheet(): WorkOrderMeasurementSheet {
    if (this == null) return WorkOrderMeasurementSheet()
    val columns = optJSONArray("columns").toWorkOrderMeasurementColumns()
    val rows = optJSONArray("rows").toWorkOrderMeasurementRows(columns)
    val pageOrientation = firstClean("pageOrientation", "orientation")
        .lowercase()
        .takeIf { it == "landscape" }
        .orEmpty()
    return WorkOrderMeasurementSheet(
        columns = columns,
        rows = rows,
        merges = optJSONArray("merges").toWorkOrderMeasurementMerges(),
        headerRows = optJSONArray("headerRows").toStringList(),
        pageOrientation = pageOrientation,
    )
}

private fun JSONObject?.toWorkOrderMeasurementSheetMap(): Map<String, WorkOrderMeasurementSheet> {
    if (this == null) return emptyMap()
    return buildMap {
        keys().forEach { key ->
            val sheet = optJSONObject(key).toWorkOrderMeasurementSheet()
            if (sheet.columns.isNotEmpty()) {
                put(key, sheet)
            }
        }
    }
}

private fun JSONObject?.toNestedWorkOrderMeasurementSheetMap(): Map<String, Map<String, WorkOrderMeasurementSheet>> {
    if (this == null) return emptyMap()
    return buildMap {
        keys().forEach { key ->
            val sheets = optJSONObject(key).toWorkOrderMeasurementSheetMap()
            if (sheets.isNotEmpty()) {
                put(key, sheets)
            }
        }
    }
}

private fun JSONArray?.toWorkOrderMeasurementTables(): List<WorkOrderMeasurementTable> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val key = item.firstClean("key", "id", "tokenKey")
            val tableOrientation = item.firstClean("pageOrientation", "orientation")
                .lowercase()
                .takeIf { it == "landscape" }
                .orEmpty()
            val sheet = item.optJSONObject("sheet").toWorkOrderMeasurementSheet()
            add(
                WorkOrderMeasurementTable(
                    id = item.firstClean("id").ifBlank { key },
                    key = key,
                    tokenKey = item.firstClean("tokenKey"),
                    label = item.firstClean("label").ifBlank { "Excel tablica" },
                    helpText = item.firstClean("helpText"),
                    summary = item.firstClean("summary"),
                    sourceSheet = item.firstClean("sourceSheet", "sheetName"),
                    includeInReport = item.optBoolean("includeInReport", true),
                    formulaOnly = item.optBoolean("formulaOnly", false),
                    sheet = if (sheet.pageOrientation.isBlank() && tableOrientation.isNotBlank()) {
                        sheet.copy(pageOrientation = tableOrientation)
                    } else {
                        sheet
                    },
                ),
            )
        }
    }.filter { it.key.isNotBlank() && it.sheet.columns.isNotEmpty() }
}

private fun JSONArray?.toWorkOrderDocumentationAiSystemRows(): List<WorkOrderDocumentationAiSystemRow> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderDocumentationAiSystemRow(
                    id = item.firstClean("id").ifBlank { "system-description-row-${index + 1}" },
                    subtitle = item.firstClean("subtitle", "label"),
                    lineCount = item.optInt("lineCount", 1).coerceIn(1, 8),
                    placeholder = item.firstClean("placeholder"),
                ),
            )
        }
    }
}

private fun JSONArray?.toWorkOrderDocumentationAiFields(): List<WorkOrderDocumentationAiField> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val id = item.firstClean("id").ifBlank { "ai-field-${index + 1}" }
            val key = item.firstClean("key")
            val label = item.firstClean("label").ifBlank { key.ifBlank { id } }
            if (id.isBlank() && key.isBlank()) continue
            add(
                WorkOrderDocumentationAiField(
                    id = id,
                    key = key,
                    label = label,
                    type = item.firstClean("type").ifBlank { "text" },
                    fieldType = item.firstClean("fieldType", "actualFieldType").ifBlank { item.firstClean("type").ifBlank { "text" } },
                    required = item.optBoolean("required", false),
                    ai = item.optJSONObject("ai") ?: item.optJSONObject("aiConfig") ?: JSONObject(),
                    valueShape = item.firstClean("valueShape"),
                    sectionSubtitle = item.firstClean("sectionSubtitle", "section_subtitle"),
                    systemRows = item.optJSONArray("systemRows").toWorkOrderDocumentationAiSystemRows(),
                ),
            )
        }
    }.distinctBy { it.id.ifBlank { it.key } }
}

private fun JSONArray?.toWorkOrderDocumentationAiMeasurementColumns(): List<WorkOrderDocumentationAiMeasurementColumn> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val fieldId = item.firstClean("fieldId")
            val columnId = item.firstClean("columnId")
            if (fieldId.isBlank() || columnId.isBlank()) continue
            add(
                WorkOrderDocumentationAiMeasurementColumn(
                    fieldId = fieldId,
                    fieldKey = item.firstClean("fieldKey"),
                    fieldLabel = item.firstClean("fieldLabel"),
                    fieldDescription = item.firstClean("fieldDescription"),
                    columnId = columnId,
                    columnIndex = item.optInt("columnIndex", index),
                    columnLetter = item.firstClean("columnLetter"),
                    key = item.firstClean("key"),
                    label = item.firstClean("label").ifBlank { columnId },
                    type = item.firstClean("type").ifBlank { "text" },
                    required = item.optBoolean("required", false),
                    placeholder = item.firstClean("placeholder"),
                    helpText = item.firstClean("helpText"),
                    aiMapping = item.optJSONObject("aiMapping") ?: item.optJSONObject("ai") ?: JSONObject(),
                ),
            )
        }
    }
}

private fun JSONArray?.toWorkOrderDocumentationTemplates(): List<WorkOrderDocumentationTemplate> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderDocumentationTemplate(
                    id = item.firstClean("id"),
                    title = item.firstClean("title").ifBlank { "Zapisnik" },
                    documentType = item.firstClean("documentType"),
                    serviceName = item.firstClean("serviceName", "name", "title", "label", "displayName"),
                    serviceCode = item.firstClean("serviceCode", "code", "shortCode", "shortLabel", "nativeServiceCode", "serviceShortCode"),
                    serviceIndex = item.optInt("serviceIndex", -1),
                    signatureAreas = item.optJSONArray("signatureAreas").toStringList(),
                    documentNumber = item.firstClean("documentNumber"),
                    documentName = item.firstClean("documentName", "fileName"),
                    dataSourceType = item.firstClean("dataSourceType"),
                    dataSourceTitle = item.firstClean("dataSourceTitle"),
                    dataSourceDate = item.firstClean("dataSourceDate"),
                    dataSourceWorkOrderNumber = item.firstClean("dataSourceWorkOrderNumber"),
                    fields = item.optJSONArray("fields").toWorkOrderDocumentationFields(),
                    fieldBlocks = item.optJSONArray("fieldBlocks").toWorkOrderDocumentationTemplateBlocks(),
                    inspectionTypeOptions = item.optJSONArray("inspectionTypeOptions").toDocumentationFieldOptions(),
                    measurementTables = item.optJSONArray("measurementTables").toWorkOrderMeasurementTables(),
                    formulaSheets = item.optJSONArray("formulaSheets").toWorkOrderMeasurementTables(),
                    aiFields = item.optJSONArray("aiFields").toWorkOrderDocumentationAiFields(),
                    aiMeasurementColumns = item.optJSONArray("aiMeasurementColumns").toWorkOrderDocumentationAiMeasurementColumns(),
                ),
            )
        }
    }.filter { it.id.isNotBlank() }
}

private fun JSONArray?.toWorkOrderDocumentationPreviousRecords(): List<WorkOrderDocumentationPreviousRecord> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val objectId = item.firstClean("objectId", "locationObjectId")
            val objectName = item.firstClean("objectName", "locationObjectName")
            if (objectId.isBlank() && objectName.isBlank()) continue
            add(
                WorkOrderDocumentationPreviousRecord(
                    id = item.firstClean("id"),
                    templateId = item.firstClean("templateId"),
                    templateTitle = item.firstClean("templateTitle", "documentType", "title"),
                    serviceCode = item.firstClean("serviceCode", "code", "nativeServiceCode"),
                    serviceName = item.firstClean("serviceName", "documentType", "templateTitle", "title"),
                    objectId = objectId,
                    objectName = objectName,
                    workOrderNumber = item.firstClean("workOrderNumber", "recordNumber"),
                    inspectionDate = item.firstClean("inspectionDate", "issuedDate", "date"),
                    updatedAt = item.firstClean("updatedAt", "createdAt"),
                ),
            )
        }
    }
}

private fun JSONArray?.toWorkOrderDocumentationOptions(): List<WorkOrderDocumentationOption> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val id = item.firstClean("id", "value", "key")
            val label = item.firstClean("label", "title", "name").ifBlank { id }
            if (id.isNotBlank() && label.isNotBlank()) {
                add(
                    WorkOrderDocumentationOption(
                        id = id,
                        label = label,
                        subtitle = item.firstClean("subtitle", "description", "metaLabel"),
                        status = item.firstClean("status"),
                        meta = item.optJSONObject("meta").toStringMap(),
                    ),
                )
            }
        }
    }.distinctBy { it.id }
}

private fun JSONArray?.toWorkOrderDocumentationSignatureAreaOptions(): List<WorkOrderDocumentationSignatureAreaOptions> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val key = item.firstClean("key", "id", "value")
            if (key.isBlank()) continue
            add(
                WorkOrderDocumentationSignatureAreaOptions(
                    key = key,
                    label = item.firstClean("label", "title", "name").ifBlank { key },
                    inspectorOptions = item.optJSONArray("inspectorOptions").toWorkOrderDocumentationOptions(),
                    authorizationOptions = item.optJSONArray("authorizationOptions").toWorkOrderDocumentationOptions(),
                    defaultInspectorIds = item.optJSONArray("defaultInspectorIds").toStringList(),
                    defaultAuthorizationHolderId = item.firstClean("defaultAuthorizationHolderId"),
                ),
            )
        }
    }.distinctBy { it.key }
}

private fun JSONObject?.toWorkOrderTrainingImportProfile(): WorkOrderTrainingImportProfile {
    if (this == null) return WorkOrderTrainingImportProfile()
    return WorkOrderTrainingImportProfile(
        enabled = optBoolean("enabled", false),
        profileName = firstClean("profileName", "name"),
        sheetName = firstClean("sheetName", "sheet"),
        headerRow = optInt("headerRow", 1),
        firstDataRow = optInt("firstDataRow", 2),
        defaultImportMode = firstClean("defaultImportMode"),
        columnCount = optInt("columnCount", 0),
        requiredColumnCount = optInt("requiredColumnCount", 0),
        columnsLabel = firstClean("columnsLabel"),
    )
}

private fun JSONArray?.toWorkOrderTrainingServices(): List<WorkOrderTrainingService> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderTrainingService(
                    id = item.firstClean("id"),
                    serviceId = item.firstClean("serviceId"),
                    serviceKey = item.firstClean("serviceKey").ifBlank { item.firstClean("id") },
                    serviceCode = item.firstClean("serviceCode"),
                    serviceName = item.firstClean("serviceName"),
                    label = item.firstClean("label", "serviceName"),
                    shortLabel = item.firstClean("shortLabel"),
                    validityMonths = item.firstClean("validityMonths"),
                    linkedLearningTestIds = item.optJSONArray("linkedLearningTestIds").toStringList(),
                    linkedLearningTestTitles = item.optJSONArray("linkedLearningTestTitles").toStringList(),
                    linkedLearningTestPassPercents = item.optJSONArray("linkedLearningTestPassPercents").toIntList(),
                    passPercent = item.firstInt(80, "passPercent"),
                    modeDefault = item.firstClean("modeDefault"),
                ),
            )
        }
    }
}

private fun JSONArray?.toWorkOrderTrainingAssignments(): List<WorkOrderTrainingAssignment> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderTrainingAssignment(
                    serviceId = item.firstClean("serviceId"),
                    serviceKey = item.firstClean("serviceKey"),
                    serviceCode = item.firstClean("serviceCode"),
                    serviceName = item.firstClean("serviceName"),
                    label = item.firstClean("label", "serviceName"),
                    mode = item.firstClean("mode"),
                    recommended = item.optBoolean("recommended", false),
                    status = item.firstClean("status"),
                    statusLabel = item.firstClean("statusLabel"),
                    proposalReason = item.firstClean("proposalReason"),
                    linkedLearningTestIds = item.optJSONArray("linkedLearningTestIds").toStringList(),
                    linkedLearningTestTitles = item.optJSONArray("linkedLearningTestTitles").toStringList(),
                    linkedLearningTestPassPercents = item.optJSONArray("linkedLearningTestPassPercents").toIntList(),
                    linkedLearningTestCount = item.optInt("linkedLearningTestCount", 0),
                    passPercent = item.firstInt(80, "passPercent"),
                    scorePercent = item.firstClean("scorePercent"),
                    passed = item.firstNullableBoolean("passed"),
                    learningStatus = item.firstClean("learningStatus"),
                    completedLearningTestCount = item.optInt("completedLearningTestCount", 0),
                    failedLearningTestCount = item.optInt("failedLearningTestCount", 0),
                    questionLimit = item.optInt("questionLimit", 0),
                    timePerQuestionSeconds = item.optInt("timePerQuestionSeconds", 0),
                    timeLimitSeconds = item.optInt("timeLimitSeconds", 0),
                    existingItemId = item.firstClean("existingItemId"),
                    existingValidUntil = item.firstClean("existingValidUntil"),
                    existingPassedOn = item.firstClean("existingPassedOn"),
                    existingDocumentId = item.firstClean("existingDocumentId"),
                ),
            )
        }
    }
}

private fun JSONArray?.toWorkOrderTrainingPeople(): List<WorkOrderTrainingPerson> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderTrainingPerson(
                    id = item.firstClean("id"),
                    fullName = item.firstClean("fullName", "name"),
                    firstName = item.firstClean("firstName"),
                    lastName = item.firstClean("lastName"),
                    oib = item.firstClean("oib"),
                    email = item.firstClean("email"),
                    phone = item.firstClean("phone"),
                    companyId = item.firstClean("companyId"),
                    companyName = item.firstClean("companyName"),
                    locationId = item.firstClean("locationId"),
                    locationName = item.firstClean("locationName"),
                    jobTitle = item.firstClean("jobTitle", "workPlace"),
                    active = item.optBoolean("active", true),
                    recommended = item.optBoolean("recommended", false),
                    recommendedCount = item.optInt("recommendedCount", 0),
                    assignments = item.optJSONArray("assignments").toWorkOrderTrainingAssignments(),
                ),
            )
        }
    }
}

private fun JSONObject?.toWorkOrderTrainingContext(): WorkOrderTrainingContext {
    if (this == null) return WorkOrderTrainingContext()
    return WorkOrderTrainingContext(
        enabled = optBoolean("enabled", false),
        companyId = firstClean("companyId"),
        companyName = firstClean("companyName"),
        locationId = firstClean("locationId"),
        locationName = firstClean("locationName"),
        defaultMode = firstClean("defaultMode").ifBlank { "online_test" },
        services = optJSONArray("services").toWorkOrderTrainingServices(),
        people = optJSONArray("people").toWorkOrderTrainingPeople(),
        peopleCount = optInt("peopleCount", 0),
        recommendedPeopleCount = optInt("recommendedPeopleCount", 0),
        proposedAssignments = optInt("proposedAssignments", 0),
        onlineAssignments = optInt("onlineAssignments", 0),
        liveAssignments = optInt("liveAssignments", 0),
        importProfile = optJSONObject("importProfile").toWorkOrderTrainingImportProfile(),
        importTemplateUrl = firstClean("importTemplateUrl"),
    )
}

private fun JSONObject.toWorkOrderDocumentationContext(): WorkOrderDocumentationContext =
    WorkOrderDocumentationContext(
        workOrderId = firstClean("workOrderId"),
        workOrderNumber = firstClean("workOrderNumber"),
        templates = optJSONArray("templates").toWorkOrderDocumentationTemplates(),
        previousRecords = optJSONArray("previousRecords").toWorkOrderDocumentationPreviousRecords(),
        hasTemplates = optBoolean("hasTemplates", false),
        fieldCount = optInt("fieldCount", 0),
        templateBlockCount = optInt("templateBlockCount", 0),
        measurementTableCount = optInt("measurementTableCount", 0),
        defaults = optJSONObject("defaults").toWorkOrderDocumentationDefaults(),
        measurementEquipmentOptions = optJSONArray("measurementEquipmentOptions").toWorkOrderDocumentationOptions(),
        workEquipmentOptions = optJSONArray("workEquipmentOptions").toWorkOrderDocumentationOptions(),
        workEquipmentMechanicalOptions = optJSONArray("workEquipmentMechanicalOptions").toWorkOrderDocumentationOptions(),
        workEquipmentElectricalOptions = optJSONArray("workEquipmentElectricalOptions").toWorkOrderDocumentationOptions(),
        workEquipmentHazardOptions = optJSONArray("workEquipmentHazardOptions").toWorkOrderDocumentationOptions(),
        workEquipmentHarmfulnessOptions = optJSONArray("workEquipmentHarmfulnessOptions").toWorkOrderDocumentationOptions(),
        workEquipmentStrainOptions = optJSONArray("workEquipmentStrainOptions").toWorkOrderDocumentationOptions(),
        workEquipmentStatus = optJSONObject("workEquipmentStatus").toStringMap(),
        workEnvironmentOptions = optJSONArray("workEnvironmentOptions").toWorkOrderDocumentationOptions(),
        workEnvironmentStatus = optJSONObject("workEnvironmentStatus").toStringMap(),
        trainingContext = optJSONObject("trainingContext").toWorkOrderTrainingContext(),
        legalFrameworkOptions = optJSONArray("legalFrameworkOptions").toWorkOrderDocumentationOptions(),
        rulebookOptions = optJSONArray("rulebookOptions").toWorkOrderDocumentationOptions(),
        signaturePersonOptions = optJSONArray("signaturePersonOptions").toWorkOrderDocumentationSignatureAreaOptions(),
    )

private fun JSONObject?.toWorkOrderDocumentationDefaults(): WorkOrderDocumentationDefaults {
    if (this == null) return WorkOrderDocumentationDefaults()
    return WorkOrderDocumentationDefaults(
        inspectionDate = firstClean("inspectionDate"),
        issuedDate = firstClean("issuedDate"),
        issuedPlace = firstClean("issuedPlace"),
        testingLocation = firstClean("testingLocation"),
        note = firstClean("note"),
        inspectionType = firstClean("inspectionType"),
        outsideTemperature = firstClean("outsideTemperature"),
        relativeHumidity = firstClean("relativeHumidity"),
        airflowSpeed = firstClean("airflowSpeed"),
        weather = firstClean("weather"),
        groundCondition = firstClean("groundCondition"),
        groundResistance = firstClean("groundResistance"),
        measurementEquipmentGroup = firstClean("measurementEquipmentGroup"),
        selectedEquipmentIds = optJSONArray("selectedEquipmentIds").toStringList(),
        selectedLegalFrameworkIds = optJSONArray("selectedLegalFrameworkIds").toStringList(),
        selectedRulebookIds = optJSONArray("selectedRulebookIds").toStringList(),
        signatureMode = firstClean("signatureMode"),
        validityMonths = firstClean("validityMonths"),
        electricalValidityMonths = firstClean("electricalValidityMonths"),
        tipkaloValidityMonths = firstClean("tipkaloValidityMonths"),
        serviceValidityMonths = optJSONObject("serviceValidityMonths").toStringMap(),
        fieldValues = optJSONObject("fieldValues").toStringMap(),
        templateFieldValues = optJSONObject("templateFieldValues").toNestedStringMap(),
        fieldSheets = optJSONObject("fieldSheets").toWorkOrderMeasurementSheetMap(),
        templateFieldSheets = optJSONObject("templateFieldSheets").toNestedWorkOrderMeasurementSheetMap(),
        includedMeasurementTableKeys = optJSONArray("includedMeasurementTableKeys").toStringList(),
        attachments = optJSONArray("attachments").toWorkOrderDocumentationAiFiles(),
        templateAttachments = optJSONObject("templateAttachments").toWorkOrderDocumentationAiFileMap(),
    )
}

private fun JSONObject.toWorkOrderDocumentationAiResult(): WorkOrderDocumentationAiResult {
    val result = optJSONObject("result") ?: parseJsonObject(firstClean("outputText")) ?: JSONObject()
    val dryRun = optBoolean("dryRun", false)
    val fieldSuggestions = result.optJSONArray("fieldSuggestions")
        ?: result.optJSONArray("field_suggestions")
    val measurementSuggestions = result.optJSONArray("measurementSuggestions")
        ?: result.optJSONArray("measurement_suggestions")
    val warnings = (
        result.optJSONArray("warnings").toStringList() +
            optJSONArray("warnings").toStringList()
        )
        .map { it.trim() }
        .filter { it.isNotBlank() }
        .distinct()
    return WorkOrderDocumentationAiResult(
        dryRun = dryRun,
        modelLabel = firstClean("modelLabel", "model"),
        message = if (dryRun) {
            firstClean("nextStep", "message").ifBlank { "NexAI dry-run je prošao, ali live pozivi nisu uključeni na serveru." }
        } else {
            result.firstClean("summary").ifBlank { firstClean("nextStep", "message") }
        },
        fieldSuggestions = fieldSuggestions.toWorkOrderDocumentationAiFieldSuggestions(),
        measurementSuggestions = measurementSuggestions.toWorkOrderDocumentationAiMeasurementSuggestions(),
        warnings = warnings,
    )
}

private fun JSONObject.toWorkEquipmentImageRecognitionResult(): WorkEquipmentImageRecognitionResult {
    val root = this
    val outputObject = parseJsonObject(root.firstClean("outputText"))
    val result = root.optJSONObject("result")
        ?: outputObject?.optJSONObject("result")
        ?: outputObject
        ?: root
    val equipment = result.optJSONArray("workEquipments")?.optJSONObject(0)
        ?: result.optJSONArray("equipments")?.optJSONObject(0)
        ?: result.optJSONObject("workEquipment")
        ?: result.optJSONObject("equipment")
        ?: result
    val fieldValues = mutableMapOf<String, String>()
    val suggestionArrays = listOfNotNull(
        result.optJSONArray("fieldSuggestions"),
        result.optJSONArray("field_suggestions"),
        root.optJSONArray("fieldSuggestions"),
        root.optJSONArray("field_suggestions"),
        outputObject?.optJSONArray("fieldSuggestions"),
        outputObject?.optJSONArray("field_suggestions"),
    )
    suggestionArrays.forEach { suggestions ->
        for (index in 0 until suggestions.length()) {
            val item = suggestions.optJSONObject(index) ?: continue
            val key = item.firstClean("fieldKey", "field_key", "key", "id").trim()
            val value = (item.opt("value") ?: item.opt("text") ?: item.opt("content") ?: "").toAiDisplayText()
            if (key.isNotBlank() && value.isNotBlank()) {
                fieldValues[key] = value
            }
        }
    }
    fun readField(vararg keys: String): String {
        keys.forEach { key ->
            val direct = equipment.firstClean(key)
            if (direct.isNotBlank()) return direct
            val suggestion = fieldValues[key]
            if (!suggestion.isNullOrBlank()) return suggestion
        }
        return ""
    }
    return WorkEquipmentImageRecognitionResult(
        profileId = readField("profileId", "profile_id", "templateId", "template_id"),
        profileName = readField("profileName", "profile_name", "templateName", "template_name"),
        name = readField("name", "equipmentName", "naziv").toDirectRoTextField(),
        manufacturer = readField("manufacturer", "producer", "maker", "brand", "proizvodac", "proizvođač").toDirectRoTextField(),
        model = readField("model", "type", "tip", "typeModel", "modelType").toDirectRoTextField(),
        serialNumber = readField("serialNumber", "serial", "serialNo", "serial_number", "serijskiBroj").toDirectRoTextField(),
        inventoryNumber = readField("inventoryNumber", "inventory", "inv", "inventarskiBroj").toDirectRoTextField(),
        technicalData = readField("technicalData", "technical", "technicalDetails", "partNumber", "part_number", "tehnickiPodaci", "tehničkiPodaci").toDirectRoTextField(),
        purposeDescription = readField("purposeDescription", "purpose", "namjena").toDirectRoTextField(),
        workspacePosition = readField("workspacePosition", "position", "location", "polozaj", "mjestoRada").toDirectRoTextField(),
        workingSubstancesAndRawMaterials = normalizeRoWorkingSubstances(
            readField("workingSubstancesAndRawMaterials", "workingSubstances", "rawMaterials", "radneTvari"),
            readField("name", "equipmentName", "naziv"),
            readField("technicalData", "technical", "technicalDetails", "partNumber", "part_number", "tehnickiPodaci", "tehničkiPodaci"),
            readField("purposeDescription", "purpose", "namjena"),
        ),
        useAndMaintenance = readField("useAndMaintenance", "maintenance", "koristenjeOdrzavanje").toDirectRoTextField(),
        methodsProceduresAndNorms = readField("methodsProceduresAndNorms", "norms", "standards", "metodePostupciNorme").toDirectRoTextField(),
        deficiencies = normalizeRoDeficienciesText(readField("deficiencies", "defects", "nedostaci")),
        measuresToEliminateDeficiencies = normalizeRoMeasuresText(readField("measuresToEliminateDeficiencies", "measures", "mjere")),
        finalGrade = readField("finalGrade", "grade", "satisfactory").ifBlank { "1" },
        mechanicalItems = equipment.roAssessmentItems("mechanicalItems", "roMechanicalItems", "mechanical", "strojarskiDio"),
        electricalItems = equipment.roAssessmentItems("electricalItems", "roElectricalItems", "electrical", "elektroDio"),
        hazardRegisterIris = equipment.roIriList("hazardRegisterIris", "hazards", "opasnosti"),
        harmfulnessRegisterIris = equipment.roIriList("harmfulnessRegisterIris", "harmfulnesses", "stetnosti"),
        strainRegisterIris = equipment.roIriList("strainRegisterIris", "strains", "napori"),
        matchedSource = readField("matchedSource", "source", "databaseMatch"),
        confidence = readField("confidence", "confidenceLevel"),
        message = result.firstClean("summary", "message")
            .ifBlank { root.firstClean("nextStep", "message") }
            .ifBlank { outputObject?.firstClean("summary", "message").orEmpty() },
        verificationQuestions = (
            equipment.roVerificationQuestions() +
                result.roVerificationQuestions() +
                root.roVerificationQuestions() +
                (outputObject?.roVerificationQuestions() ?: emptyList())
            ).distinct().take(40),
    )
}

private fun JSONObject.toWorkEquipmentImageRecognitionBatchResult(): WorkEquipmentImageRecognitionResult {
    val root = this
    val outputObject = parseJsonObject(root.firstClean("outputText"))
    val result = root.optJSONObject("result")
        ?: outputObject?.optJSONObject("result")
        ?: outputObject
        ?: root
    val equipmentArray = result.optJSONArray("workEquipments")
        ?: result.optJSONArray("equipments")
        ?: root.optJSONArray("workEquipments")
        ?: root.optJSONArray("equipments")
        ?: outputObject?.optJSONArray("workEquipments")
        ?: outputObject?.optJSONArray("equipments")

    fun JSONObject.field(vararg keys: String): String {
        keys.forEach { key ->
            val value = firstClean(key)
            if (value.isNotBlank()) return value
        }
        return ""
    }

    fun JSONObject.imageIndexes(): List<Int> {
        val arrayValues = optJSONArray("imageIndexes").toIntList()
            .ifEmpty { optJSONArray("sourceImageIndexes").toIntList() }
            .ifEmpty { optJSONArray("images").toIntList() }
        val single = firstInt(0, "imageIndex", "sourceImageIndex", "imageOrder")
        return (arrayValues + listOfNotNull(single.takeIf { it > 0 })).distinct()
    }

    fun JSONObject.sourceImageNames(): List<String> =
        optJSONArray("sourceImageNames").toStringList("name", "fileName", "label")
            .ifEmpty { optJSONArray("imageNames").toStringList("name", "fileName", "label") }
            .ifEmpty { optJSONArray("sourceFiles").toStringList("name", "fileName", "label") }

    fun parseItem(item: JSONObject): WorkEquipmentImageRecognitionResult =
        WorkEquipmentImageRecognitionResult(
            profileId = item.field("profileId", "profile_id", "templateId", "template_id"),
            profileName = item.field("profileName", "profile_name", "templateName", "template_name"),
            name = item.field("name", "equipmentName", "title", "naziv").toDirectRoTextField(),
            manufacturer = item.field("manufacturer", "producer", "maker", "brand", "proizvodac").toDirectRoTextField(),
            model = item.field("model", "type", "tip", "typeModel", "modelType").toDirectRoTextField(),
            serialNumber = item.field("serialNumber", "serial", "serialNo", "serial_number", "serijskiBroj").toDirectRoTextField(),
            inventoryNumber = item.field("inventoryNumber", "inventory", "inv", "inventarskiBroj").toDirectRoTextField(),
            technicalData = item.field("technicalData", "technical", "technicalDetails", "partNumber", "part_number", "tehnickiPodaci").toDirectRoTextField(),
            purposeDescription = item.field("purposeDescription", "purpose", "namjena").toDirectRoTextField(),
            workspacePosition = item.field("workspacePosition", "position", "location", "polozaj", "mjestoRada").toDirectRoTextField(),
            workingSubstancesAndRawMaterials = normalizeRoWorkingSubstances(
                item.field("workingSubstancesAndRawMaterials", "workingSubstances", "rawMaterials", "radneTvari"),
                item.field("name", "equipmentName", "title", "naziv"),
                item.field("technicalData", "technical", "technicalDetails", "partNumber", "part_number", "tehnickiPodaci"),
                item.field("purposeDescription", "purpose", "namjena"),
            ),
            useAndMaintenance = item.field("useAndMaintenance", "maintenance", "koristenjeOdrzavanje").toDirectRoTextField(),
            methodsProceduresAndNorms = item.field("methodsProceduresAndNorms", "norms", "standards", "metodePostupciNorme").toDirectRoTextField(),
            deficiencies = normalizeRoDeficienciesText(item.field("deficiencies", "defects", "nedostaci")),
            measuresToEliminateDeficiencies = normalizeRoMeasuresText(item.field("measuresToEliminateDeficiencies", "measures", "mjere")),
            finalGrade = item.field("finalGrade", "grade", "satisfactory").ifBlank { "1" },
            mechanicalItems = item.roAssessmentItems("mechanicalItems", "roMechanicalItems", "mechanical", "strojarskiDio"),
            electricalItems = item.roAssessmentItems("electricalItems", "roElectricalItems", "electrical", "elektroDio"),
            hazardRegisterIris = item.roIriList("hazardRegisterIris", "hazards", "opasnosti"),
            harmfulnessRegisterIris = item.roIriList("harmfulnessRegisterIris", "harmfulnesses", "stetnosti"),
            strainRegisterIris = item.roIriList("strainRegisterIris", "strains", "napori"),
            matchedSource = item.field("matchedSource", "source", "databaseMatch"),
            confidence = item.field("confidence", "confidenceLevel"),
            message = item.field("summary", "message"),
            verificationQuestions = item.roVerificationQuestions(),
            imageIndexes = item.imageIndexes(),
            sourceImageNames = item.sourceImageNames(),
        )

    val items = buildList {
        if (equipmentArray != null) {
            for (index in 0 until equipmentArray.length()) {
                val item = equipmentArray.optJSONObject(index) ?: continue
                add(parseItem(item))
            }
        }
    }.filter { item ->
        listOf(
            item.name,
            item.manufacturer,
            item.model,
            item.serialNumber,
            item.inventoryNumber,
            item.technicalData,
            item.purposeDescription,
            item.workspacePosition,
            item.workingSubstancesAndRawMaterials,
            item.deficiencies,
        ).any { it.isNotBlank() } ||
            item.mechanicalItems.isNotEmpty() ||
            item.electricalItems.isNotEmpty() ||
            item.hazardRegisterIris.isNotEmpty() ||
            item.harmfulnessRegisterIris.isNotEmpty() ||
            item.strainRegisterIris.isNotEmpty()
    }
    val fallback = parseItem(
        result.optJSONObject("workEquipment")
            ?: result.optJSONObject("equipment")
            ?: root.optJSONObject("workEquipment")
            ?: root.optJSONObject("equipment")
            ?: result,
    )
    val message = result.firstClean("summary", "message")
        .ifBlank { root.firstClean("nextStep", "message") }
        .ifBlank { outputObject?.firstClean("summary", "message").orEmpty() }
    val recognized = items.ifEmpty {
        if (
            listOf(
                fallback.name,
                fallback.manufacturer,
                fallback.model,
                fallback.serialNumber,
                fallback.inventoryNumber,
                fallback.technicalData,
                fallback.purposeDescription,
                fallback.workspacePosition,
                fallback.workingSubstancesAndRawMaterials,
                fallback.deficiencies,
            ).any { it.isNotBlank() } ||
            fallback.mechanicalItems.isNotEmpty() ||
            fallback.electricalItems.isNotEmpty() ||
            fallback.hazardRegisterIris.isNotEmpty() ||
            fallback.harmfulnessRegisterIris.isNotEmpty() ||
            fallback.strainRegisterIris.isNotEmpty()
        ) {
            listOf(fallback)
        } else {
            emptyList()
        }
    }.map { item ->
        item.copy(message = item.message.ifBlank { message }, workEquipments = emptyList())
    }
    val primary = recognized.firstOrNull() ?: fallback
    val verificationQuestions = (
        result.roVerificationQuestions() +
            root.roVerificationQuestions() +
            (outputObject?.roVerificationQuestions() ?: emptyList()) +
            recognized.flatMap { it.verificationQuestions }
        ).distinct().take(40)
    return primary.copy(
        message = message,
        verificationQuestions = verificationQuestions,
        workEquipments = recognized,
    )
}

private fun JSONObject.toSprVoiceAiResult(): SprVoiceAiResult {
    val provider = firstClean("provider").ifBlank { "local" }
    val rows = optJSONArray("rows").toSprVoiceAiRows()
    return SprVoiceAiResult(
        provider = provider,
        rows = rows,
        message = firstClean("message").ifBlank {
            if (provider.equals("openai", ignoreCase = true)) {
                "NexAI je strukturirao ${rows.size} redaka."
            } else {
                "Korišten je lokalni parser za ${rows.size} redaka."
            }
        },
    )
}

private fun JSONArray?.toSprVoiceAiRows(): List<SprVoiceAiRow> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val board = item.firstClean("board", "razdjelnik", "razdjelnikOrmar", "ormar", "panel")
            val circuit = item.firstClean("circuit", "strujniKrug", "oznakaStrujnogKruga", "oznaka", "krug")
            val rcdRating = item.firstClean("rcdRating", "rating", "inIdn", "in_idn", "karakteristika", "pid")
            val protectionType = item.firstClean("protectionType", "protection", "zastita")
            val protectionDevice = item.firstClean("protectionDevice", "device", "breaker", "osigurac", "oznakaOsiguraca")
            val phaseCount = item.firstClean("phaseCount", "phase", "phases", "brojFaza", "oneThree", "oneThreePhase")
            val target = item.firstClean("target", "table", "tableKind", "measurementTable", "rowTarget")
            val earthResistance = item.firstClean("earthResistance", "otporUzemljenja", "uzemljenje", "earth")
            val pipeResistance = item.firstClean("pipeResistance", "otporCijevi", "hoseResistance", "cijev", "pipe")
            val electrostaticField = item.firstClean("electrostaticField", "elektrostatickoPolje", "electrostatic")
            val allowedResistance = item.firstClean("allowedResistance", "dozvoljeniOtpor", "dopusteniOtpor", "allowed")
            val pass = item.firstClean("pass", "ocjena", "zadovoljava", "result")
            val note = item.firstClean("note", "napomena", "comment")
            val place = item.firstClean("place", "mjesto", "location", "room", "name").ifBlank { board.ifBlank { circuit } }
            val exeiIpkLike = circuit.isNotBlank() && (protectionType.isNotBlank() || protectionDevice.isNotBlank() || phaseCount.isNotBlank())
            val lampCount = item.firstClean("lampCount", "brojLampi", "count", "value", "quantity")
                .ifBlank { if (exeiIpkLike) phaseCount else circuit }
            val kind = item.firstClean("kind", "type", "rowType")
            val isSection = kind.equals("section", ignoreCase = true) ||
                kind.equals("floor", ignoreCase = true) ||
                item.optBoolean("isSection", false)
            val isZudsRow = board.isNotBlank() || rcdRating.isNotBlank() || (circuit.isNotBlank() && !exeiIpkLike)
            val isExseRow = listOf(
                target,
                earthResistance,
                pipeResistance,
                electrostaticField,
                allowedResistance,
                pass,
                note,
            ).any { it.isNotBlank() }
            val lampCountRaw = item.firstClean("lampCount", "brojLampi", "count", "value", "quantity", "phaseCount", "phase")
            if (place.isBlank() || (!isSection && !isZudsRow && !isExseRow && lampCount.isBlank())) continue
            add(
                SprVoiceAiRow(
                    place = place,
                    lampCount = if (isSection) "" else lampCountRaw.ifBlank { lampCount },
                    kind = if (isSection) "section" else kind,
                    protectionType = protectionType,
                    protectionDevice = protectionDevice,
                    phaseCount = phaseCount,
                    zLpe = item.firstClean("zLpe", "zlpe", "zlp", "ZL-PE", "Z(L-PE)"),
                    zLn = item.firstClean("zLn", "zln", "ZL-N", "Z(L-N)"),
                    zLl = item.firstClean("zLl", "zll", "ZL-L", "Z(L-L)"),
                    board = board,
                    circuit = circuit,
                    rcdRating = rcdRating,
                    target = target,
                    earthResistance = earthResistance,
                    pipeResistance = pipeResistance,
                    electrostaticField = electrostaticField,
                    allowedResistance = allowedResistance,
                    pass = pass,
                    note = note,
                ),
            )
        }
    }
}

private fun JSONArray?.toWorkOrderDocumentationAiFieldSuggestions(): List<WorkOrderDocumentationAiFieldSuggestion> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val value = item.opt("value") ?: item.opt("text") ?: item.opt("content") ?: ""
            val rawValueJson = value.toRawJsonText()
            val valueText = value.toAiDisplayText()
            if (rawValueJson.isBlank() && valueText.isBlank()) continue
            add(
                WorkOrderDocumentationAiFieldSuggestion(
                    fieldId = item.firstClean("fieldId", "field_id", "id"),
                    fieldKey = item.firstClean("fieldKey", "field_key", "key"),
                    fieldLabel = item.firstClean("fieldLabel", "field_label", "label"),
                    valueText = valueText,
                    rawValueJson = rawValueJson,
                    confidence = item.firstClean("confidence"),
                    reason = item.firstClean("reason", "explanation"),
                    sourceFile = item.firstClean("sourceFile", "source_file"),
                ),
            )
        }
    }
}

private fun JSONArray?.toWorkOrderDocumentationAiMeasurementSuggestions(): List<WorkOrderDocumentationAiMeasurementSuggestion> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val rows = item.optJSONArray("rows").toWorkOrderDocumentationAiMeasurementRows()
            if (rows.isEmpty()) continue
            add(
                WorkOrderDocumentationAiMeasurementSuggestion(
                    fieldId = item.firstClean("fieldId", "field_id", "id"),
                    fieldKey = item.firstClean("fieldKey", "field_key", "key"),
                    fieldLabel = item.firstClean("fieldLabel", "field_label", "label"),
                    rows = rows,
                    confidence = item.firstClean("confidence"),
                    sourceFile = item.firstClean("sourceFile", "source_file"),
                ),
            )
        }
    }
}

private fun JSONArray?.toWorkOrderDocumentationAiMeasurementRows(): List<WorkOrderDocumentationAiMeasurementRowSuggestion> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val values = item.optJSONObject("values").toStringMap()
            val orderedValues = item.optJSONArray("orderedValues").toStringList().ifEmpty {
                item.optJSONArray("ordered_values").toStringList()
            }
            if (values.isEmpty() && orderedValues.isEmpty()) continue
            add(
                WorkOrderDocumentationAiMeasurementRowSuggestion(
                    values = values,
                    orderedValues = orderedValues,
                    confidence = item.firstClean("confidence"),
                    sourceFile = item.firstClean("sourceFile", "source_file"),
                ),
            )
        }
    }
}

private fun parseJsonObject(value: String): JSONObject? =
    runCatching {
        val trimmed = value.trim()
        if (trimmed.isBlank()) null else JSONObject(trimmed)
    }.getOrNull()

private fun Any?.toRawJsonText(): String = when (this) {
    null, JSONObject.NULL -> ""
    is JSONObject, is JSONArray -> toString()
    else -> toString().trim()
}

private fun Any?.toAiDisplayText(): String {
    if (this == null || this == JSONObject.NULL) return ""
    if (this is JSONObject) {
        val blocks = optJSONArray("blocks")
        if (blocks != null) {
            val parts = mutableListOf<String>()
            for (blockIndex in 0 until blocks.length()) {
                val block = blocks.optJSONObject(blockIndex) ?: continue
                block.firstClean("title").takeIf { it.isNotBlank() }?.let(parts::add)
                block.firstClean("sectionSubtitle", "section_subtitle", "subtitle").takeIf { it.isNotBlank() }?.let(parts::add)
                val rows = block.optJSONArray("rows")
                if (rows != null) {
                    for (rowIndex in 0 until rows.length()) {
                        val row = rows.optJSONObject(rowIndex) ?: continue
                        val description = row.firstClean("description", "value", "text", "content")
                        if (description.isNotBlank()) {
                            val subtitle = row.firstClean("subtitle", "label")
                            parts.add(listOf(subtitle, description).filter { it.isNotBlank() }.joinToString(": "))
                        }
                    }
                }
            }
            return parts.distinct().joinToString("\n").trim()
        }
        return firstClean("description", "value", "text", "content").ifBlank { toString() }
    }
    if (this is JSONArray) {
        return buildList {
            for (index in 0 until length()) {
                opt(index).toAiDisplayText().takeIf { it.isNotBlank() }?.let(::add)
            }
        }.joinToString("\n")
    }
    return toString().trim()
}

private fun JSONArray?.toRecords(): List<MobileRecord> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                MobileRecord(
                    id = item.firstClean("id"),
                    title = item.firstClean("title").ifBlank { "Zapis" },
                    subtitle = item.firstClean("subtitle"),
                    status = item.firstClean("status"),
                    kind = item.firstClean("kind"),
                    date = item.firstClean("date"),
                    relatedId = item.firstClean("relatedId"),
                    coordinates = item.firstClean("coordinates"),
                    meta = item.optJSONObject("meta").toStringMap(),
                ),
            )
        }
    }.sortedWith(
        compareBy<MobileRecord> { if (it.parsedDate == null) 1 else 0 }
            .thenBy { it.parsedDate }
            .thenBy { it.title.lowercase() },
    )
}

private fun JSONArray?.toOptions(): List<OptionItem> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            val value = item.firstClean("value")
            val label = item.firstClean("label").ifBlank { value }
            if (value.isNotBlank()) add(OptionItem(value, label))
        }
    }
}

private fun JSONArray?.toWorkOrderCompanies(): List<WorkOrderCompanyOption> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderCompanyOption(
                    id = item.firstClean("id"),
                    name = item.firstClean("name"),
                    oib = item.firstClean("oib"),
                    headquarters = item.firstClean("headquarters"),
                    contractType = item.firstClean("contractType"),
                    contactPhone = item.firstClean("contactPhone"),
                    contactEmail = item.firstClean("contactEmail"),
                ),
            )
        }
    }.filter { it.id.isNotBlank() && it.name.isNotBlank() }
}

private fun JSONArray?.toWorkOrderLocations(): List<WorkOrderLocationOption> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(item.toWorkOrderLocationOption())
        }
    }.filter { it.id.isNotBlank() && it.companyId.isNotBlank() && it.name.isNotBlank() }
}

private fun JSONObject.toWorkOrderLocationOption(): WorkOrderLocationOption =
    WorkOrderLocationOption(
        id = firstClean("id"),
        companyId = firstClean("companyId"),
        name = firstClean("name"),
        coordinates = firstClean("coordinates"),
        region = firstClean("region"),
        contactName1 = firstClean("contactName1"),
        contactPhone1 = firstClean("contactPhone1"),
        contactEmail1 = firstClean("contactEmail1"),
        contactName2 = firstClean("contactName2"),
        contactPhone2 = firstClean("contactPhone2"),
        contactEmail2 = firstClean("contactEmail2"),
        contactName3 = firstClean("contactName3"),
        contactPhone3 = firstClean("contactPhone3"),
        contactEmail3 = firstClean("contactEmail3"),
    )

private fun JSONArray?.toWorkOrderUsers(): List<WorkOrderUserOption> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderUserOption(
                    id = item.firstClean("id"),
                    label = item.firstClean("label"),
                    fullName = item.firstClean("fullName"),
                    email = item.firstClean("email"),
                    oib = item.firstClean("oib"),
                    isznrTags = item.optJSONArray("isznrTags").toStringList(),
                ),
            )
        }
    }.filter { it.label.isNotBlank() }
}

private fun JSONArray?.toWorkOrderServices(): List<WorkOrderServiceOption> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderServiceOption(
                    id = item.firstClean("id"),
                    name = item.firstClean("name"),
                    serviceCode = item.firstClean("serviceCode"),
                    type = item.firstClean("type"),
                    validityMonths = item.firstClean("validityMonths"),
                    note = item.firstClean("note"),
                ),
            )
        }
    }.filter { service ->
        service.id.isNotBlank() &&
            (service.name.isNotBlank() || service.serviceCode.isNotBlank()) &&
            !service.isHiddenMobileWorkOrderServiceAlias()
    }
}

private fun WorkOrderServiceOption.isHiddenMobileWorkOrderServiceAlias(): Boolean =
    serviceCode.trim().uppercase(Locale.ROOT) in setOf("ROG", "RADNAOPREMA")

private fun JSONArray?.toWorkOrderLocationObjects(): List<WorkOrderLocationObjectOption> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderLocationObjectOption(
                    id = item.firstClean("id"),
                    companyId = item.firstClean("companyId"),
                    locationId = item.firstClean("locationId"),
                    name = item.firstClean("name").ifBlank { "Objekt" },
                    code = item.firstClean("code"),
                    description = item.firstClean("description"),
                ),
            )
        }
    }.filter { it.id.isNotBlank() && it.locationId.isNotBlank() && it.name.isNotBlank() }
        .sortedWith(compareBy<WorkOrderLocationObjectOption> { it.name.lowercase() }.thenBy { it.code.lowercase() })
}

private fun JSONArray?.toWorkOrderServiceDetails(): List<WorkOrderServiceItem> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = opt(index)
            if (item is JSONObject) {
                add(
                    WorkOrderServiceItem(
                        serviceId = item.firstClean("serviceId", "id", "serviceCatalogId", "catalogServiceId", "serviceKey", "key"),
                        name = item.firstClean("name", "serviceName", "title", "label", "displayName"),
                        serviceCode = item.firstClean("serviceCode", "code", "shortCode", "shortLabel", "nativeServiceCode", "serviceShortCode"),
                        serviceStatus = item.firstClean("serviceStatus", "progressStatus", "workStatus"),
                        quantity = item.firstClean("quantity", "measurementQuantity", "count").ifBlank { "1" },
                    ),
                )
            } else {
                val value = item?.toString()?.trim().orEmpty()
                if (value.isNotBlank() && value != "null") {
                    add(WorkOrderServiceItem("", value, "", "", "1"))
                }
            }
        }
    }.filter { it.name.isNotBlank() || it.serviceCode.isNotBlank() || it.serviceId.isNotBlank() }
}

private fun JSONArray?.toWorkOrderDocuments(): List<WorkOrderDocument> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(
                WorkOrderDocument(
                    id = item.firstClean("id"),
                    workOrderId = item.firstClean("workOrderId"),
                    fileName = item.firstClean("fileName", "name").ifBlank { "Dokument" },
                    fileType = item.firstClean("fileType", "mimeType"),
                    fileSize = item.optLong("fileSize", item.optLong("size", 0L)),
                    documentCategory = item.firstClean("documentCategory", "category").ifBlank { "Ostalo" },
                    description = item.firstClean("description"),
                    sourceType = item.firstClean("sourceType").ifBlank { "editor" },
                    signatureFieldRole = item.firstClean("signatureFieldRole", "signature_field_role"),
                    signatureFieldOib = item.firstClean("signatureFieldOib", "signerOib", "signature_field_oib"),
                    preferredField = item.firstClean("preferredField", "preferred_field"),
                    signatureFieldsJson = item.firstClean("signatureFieldsJson", "signature_fields_json"),
                    signedFieldsJson = item.firstClean("signedFieldsJson", "signed_fields_json"),
                    signatureReviewStatus = item.firstClean("signatureReviewStatus", "signature_review_status"),
                    createdAt = item.firstClean("createdAt", "updatedAt"),
                ),
            )
        }
    }.sortedByDescending { it.createdAt }
}

private val workOrderNumberPartPattern = Regex("""\d+""")

private fun workOrderNumberSortParts(value: String): List<Long> =
    workOrderNumberPartPattern.findAll(value)
        .mapNotNull { match -> match.value.toLongOrNull() }
        .toList()

private fun compareWorkOrdersByNumberDescending(left: WorkOrder, right: WorkOrder): Int {
    val leftParts = workOrderNumberSortParts(left.number)
    val rightParts = workOrderNumberSortParts(right.number)
    val maxParts = maxOf(leftParts.size, rightParts.size)

    for (index in 0 until maxParts) {
        val leftPart = leftParts.getOrNull(index) ?: Long.MIN_VALUE
        val rightPart = rightParts.getOrNull(index) ?: Long.MIN_VALUE
        if (leftPart != rightPart) {
            return rightPart.compareTo(leftPart)
        }
    }

    return right.number.compareTo(left.number, ignoreCase = true)
}

private fun JSONArray?.toWorkOrders(): List<WorkOrder> {
    if (this == null) return emptyList()
    return buildList {
        for (index in 0 until length()) {
            val item = optJSONObject(index) ?: continue
            add(item.toWorkOrder())
        }
    }.sortedWith(
        Comparator { left, right ->
            compareWorkOrdersByNumberDescending(left, right).takeIf { it != 0 }
                ?: compareValuesBy(right, left) { it.parsedOpenedDate ?: it.parsedDueDate ?: LocalDate.MIN }
        },
    )
}

private fun JSONObject.toWorkOrder(): WorkOrder {
    val serviceDetails = optJSONArray("serviceItems").toWorkOrderServiceDetails()
    val serviceItems = serviceDetails
        .map { service -> service.name.ifBlank { service.serviceCode.ifBlank { service.serviceId } } }
        .filter { it.isNotBlank() }
        .ifEmpty { optJSONArray("serviceItems").toStringList("name", "serviceCode") }

    return WorkOrder(
        id = firstClean("id"),
        number = firstClean("workOrderNumber", "number"),
        status = firstClean("status").ifBlank { "Otvoreni RN" },
        companyId = firstClean("companyId"),
        companyName = firstClean("companyName", "company"),
        companyOib = firstClean("companyOib", "oib"),
        headquarters = firstClean("headquarters", "companyHeadquarters"),
        locationId = firstClean("locationId"),
        locationName = firstClean("locationName", "location"),
        objectId = firstClean("objectId", "locationObjectId"),
        objectName = firstClean("objectName", "locationObjectName"),
        coordinates = firstClean("coordinates"),
        region = firstClean("region"),
        serviceLine = firstClean("serviceLine"),
        serviceItems = serviceItems,
        serviceDetails = serviceDetails,
        openedDate = firstClean("openedDate", "createdAt"),
        dueDate = firstClean("dueDate"),
        executionDate = firstClean("executionDate"),
        priority = firstClean("priority").ifBlank { "Normal" },
        contactName = firstClean("contactName"),
        contactPhone = firstClean("contactPhone"),
        contactEmail = firstClean("contactEmail"),
        description = firstClean("description", "note"),
        executors = optJSONArray("executors").toStringList("fullName", "name", "label", "email"),
        completedBy = firstClean("completedBy", "completedByLabel", "createdByLabel"),
        tags = toWorkOrderTags(),
        watcherIds = optJSONArray("watcherIds").toStringList("userId", "id", "value", "email"),
    )
}

private fun JSONObject.toPagedMobileRecords(): PagedMobileRecords =
    PagedMobileRecords(
        records = optJSONArray("records").toRecords(),
        total = firstInt(0, "total"),
        offset = firstInt(0, "offset"),
        nextOffset = firstInt(0, "nextOffset"),
        hasMore = optBoolean("hasMore", false),
    )

private fun JSONObject.toWorkOrderTags(): List<String> {
    val arrayTags = optJSONArray("tags").toStringList("name", "label", "value", "title")
    val textTags = firstClean("tagText", "tagsText", "tag")
        .split(',', ';', '\n', '•')
        .map { it.trim().trim('#') }
    return (arrayTags + textTags)
        .map { it.trim().trim('#') }
        .filter { it.isNotBlank() && it != "null" }
        .distinctBy { it.lowercase(Locale.getDefault()) }
}
