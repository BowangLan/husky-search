export type MyPlanCourse = {
  id: string
  courseId: string
  code: string
  subject: string
  level: string
  title: string
  credit: string | string[]
  campus: string
  termId: string
  institution: string
  allCredits: string[]
  genEduReqs: string[]
  sectionGroups: string[]
  startTime: number
  endTime: number
  score: number
  latestVersion: boolean
  expiringTermId: any
  beginningTermId: any
  prereqs: string
  onlineLearningCodes: string[]
  meetingDays: string[]
  versions: any[]
  gradingSystems: string[]
  open: boolean
  tba: boolean
  pce: boolean
  enrRestricted: boolean
}

export type MyPlanCourseCodeGroup = {
  code: string
  title: string
  subjectAreaCode: string
  subjectAreaTitle: string
  data: {
    data: MyPlanCourse
    quarter: string
    subjectAreaCode: string
    myplanId: string
  }[]
}

export type MyPlanCourseDetail = {
  courseSummaryDetails: {
    courseId: string
    versionIndependentId: string
    code: string
    campusCd: string
    subjectArea: string
    courseNumber: string
    courseTitle: string
    credit: string
    courseDescription: string
    termsOffered: Array<any>
    curriculumTitle: string
    campusLocations: Array<string>
    requisites: Array<any>
    genEdRequirements: Array<string>
    abbrGenEdRequirements: Array<string>
    crossListings: Array<any>
    versions: Array<{
      courseId: string
      termId: string
      nextTermId: null | string
      nextCourseId: null | string
      prevTermId: null | string
      prevCourseId: null | string
    }>
    version: {
      courseId: string
      termId: string
      nextTermId: null | string
      nextCourseId: null | string
      prevTermId: null | string
      prevCourseId: null | string
    }
    effectiveMessage: null | string
    expiredMessage: null | string
    lastOffered: null | string
    scheduledTerms: Array<string>
    url: string
    specialAh: boolean
    startTerm: string
    endTerm: string
    recommendedPrep: null | string
    overlappingCourses: string
    equivalentCourses: string
    additionalCurricularRelationship: string
  }
  courseOfferingInstitutionList: Array<{
    code: number
    name: string
    courseOfferingTermList: Array<{
      yearTerm: {
        year: number
        term: number
        value: number
        shortTermID: string
        termLabel: string
        termAsString: string
        yearAsString: string
        termAsID: string
      }
      term: string
      courseComments: null | string
      curriculumComments: null | string
      instituteCode: number
      coursePlanType: null | string
      activityOfferingItemList: Array<{
        code: string
        campus: string
        feeAmount: null | string
        activityId: string
        activityOfferingType: string
        credits: string
        meetingDetailsList: Array<{
          days: string
          time: string
          building: string
          room: string
          campus: string
        }>
        atpId: string
        registrationCode: string
        qtryr: string
        enrollRestriction: boolean
        enrollStatus: string
        enrollCount: string
        enrollMaximum: string
        enrollEstimate: string
        instructor?: string
        details: string
        stateKey: string
        onlineLearningText: string
        honorsSection: boolean
        jointOffering: boolean
        research: boolean
        writingSection: boolean
        serviceLearning: boolean
        newThisYear: boolean
        ineligibleForFinancialAid: boolean
        addCodeRequired: boolean
        independentStudy: boolean
        hasSyllabus: boolean
        gradingOption: null | string
        gradingOptionId: string
        selectedCredit: null | string
        sectionComments?: string
        timeScheduleGeneratedComments: Array<string>
        summerTerm?: string
        planItemId: null | string
        courseId: string
        courseCode: string
        primary: boolean
        openForPlanning: boolean
        openForNotify: boolean
        primaryActivityOfferingCode: string
        primaryActivityOfferingId: string
        instituteCode: string
        instituteName: string
        geneds: Array<string>
        validationIssues: {}
        partOfBlockWithIssues: boolean
        blockRegistration?: {
          type: string
          courses: Array<{
            label: string
            courseCode: string
            parent: boolean
            sections: Array<{
              code: string
              sln: string
            }>
          }>
          parent: boolean
          parentSlns: Array<string>
        }
        allInstructors: Array<{
          name: string
          regId: string
          percentInvolvement: string
        }>
        timeMaskFlag: boolean
        duplicateEnrollmentAllowed: boolean
        addCode: null | string
      }>
    }>
  }>
  plannedCourseSummary: {
    acadRecList: Array<{
      uuid: string
      activityOfferingItem: {
        code: null | string
        campus: null | string
        feeAmount: null | string
        activityId: null | string
        activityOfferingType: null | string
        credits: null | string
        meetingDetailsList: Array<any>
        atpId: null | string
        registrationCode: any
        qtryr: null | string
        enrollRestriction: boolean
        enrollStatus: null | string
        enrollCount: any
        enrollMaximum: any
        enrollEstimate: any
        instructor: any
        details: any
        stateKey: any
        onlineLearningText: string
        honorsSection: boolean
        jointOffering: boolean
        research: boolean
        writingSection: boolean
        serviceLearning: boolean
        newThisYear: boolean
        ineligibleForFinancialAid: boolean
        addCodeRequired: boolean
        independentStudy: boolean
        hasSyllabus: boolean
        gradingOption: any
        gradingOptionId: any
        selectedCredit: any
        sectionComments: any
        timeScheduleGeneratedComments: Array<any>
        summerTerm: any
        planItemId: any
        courseId: any
        courseCode: any
        primary: boolean
        openForPlanning: boolean
        openForNotify: boolean
        primaryActivityOfferingCode: any
        primaryActivityOfferingId: any
        instituteCode: any
        instituteName: any
        geneds: Array<any>
        validationIssues: {}
        partOfBlockWithIssues: boolean
        blockRegistration: any
        allInstructors: Array<any>
        timeMaskFlag: boolean
        duplicateEnrollmentAllowed: boolean
        addCode: any
      }
      grade: string
      repeated: boolean
      atpId: string
      personId: string
      courseCode: string
      activityCode: Array<string>
      credit: string
      courseTitle: string
      courseId: string
    }>
    academicTerms: Array<string>
    savedItemDateCreated: any
    recommendedItemDataObjects: Array<any>
    plannedList: Array<any>
    backupList: Array<{
      id: string
      dateAdded: number
      planType: string
      atp: string
      refObjId: string
      refObjType: string
      term: string
      type: string
      termName: string
      year: number
      creditPref: any
      atpIds: any
    }>
    savedItemId: any
  }
  filtersApplied: any
}
