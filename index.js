'use strict'

const _ = require('lodash')
const Sequelize = require('sequelize')

let Service
let Instance
let ServiceInstance
let Check
let InstanceCheck
let ServiceCheck

const initModels = (sequelize) => {
  Service = sequelize.define('service', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    url: Sequelize.STRING,
    name: Sequelize.STRING,
    runbook_link: Sequelize.STRING,
    overall_status: Sequelize.STRING,
    old_overall_status: Sequelize.STRING,

    sms_alert: Sequelize.BOOLEAN,
    email_alert: Sequelize.BOOLEAN,
    hipchat_alert: Sequelize.BOOLEAN,
    alerts_enabled: Sequelize.BOOLEAN,
    telephone_alert: Sequelize.BOOLEAN,
  }, {
    timestamps: false,
    tableName: 'cabotapp_service',
  })

  Instance = sequelize.define('instance', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: Sequelize.STRING,
    address: Sequelize.STRING,
    runbook_link: Sequelize.STRING,
    overall_status: Sequelize.STRING,
    old_overall_status: Sequelize.STRING,

    sms_alert: Sequelize.BOOLEAN,
    email_alert: Sequelize.BOOLEAN,
    hipchat_alert: Sequelize.BOOLEAN,
    alerts_enabled: Sequelize.BOOLEAN,
    telephone_alert: Sequelize.BOOLEAN,
  }, {
    timestamps: false,
    tableName: 'cabotapp_instance',
  })

  ServiceInstance = sequelize.define('serviceInstance', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    service_id: Sequelize.INTEGER,
    instance_id: Sequelize.INTEGER,
  }, {
    timestamps: false,
    tableName: 'cabotapp_service_instances',
  })

  InstanceCheck = sequelize.define('instanceCheck', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    instance_id: Sequelize.INTEGER,
    statuscheck_id: Sequelize.INTEGER,
  }, {
    timestamps: false,
    tableName: 'cabotapp_instance_status_checks',
  })

  ServiceCheck = sequelize.define('serviceCheck', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    service_id: Sequelize.INTEGER,
    statuscheck_id: Sequelize.INTEGER,
  }, {
    timestamps: false,
    tableName: 'cabotapp_service_status_checks',
  })

  Check = sequelize.define('check', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: Sequelize.STRING,
    importance: Sequelize.STRING,
    frequency: Sequelize.INTEGER,
    calculated_status: Sequelize.INTEGER,
    status_code: Sequelize.STRING,
    text_match: Sequelize.STRING,
    timeout: Sequelize.INTEGER,
    endpoint: Sequelize.STRING,
    allowed_num_failures: Sequelize.INTEGER,
    debounce: Sequelize.INTEGER,
    polymorphic_ctype_id: Sequelize.INTEGER,

    active: Sequelize.BOOLEAN,
    verify_ssl_certificate: Sequelize.BOOLEAN,
  }, {
    timestamps: false,
    tableName: 'cabotapp_statuscheck',
  })
}

const mapCheckType = (type) => {
  if (type === 'http') {
    return 32
  }
  return 34
}

const createChecks = (dataInstance, savedInstance, savedService) => {
  return dataInstance.checks.map(c => {
    const data = _.merge({
      name: `${dataInstance.address} ${c.type}`,
      active: true,
      importance: 'ERROR',
      frequency: 5,
      calculated_status: 'failed',
      verify_ssl_certificate: true,
      status_code: '200',
      timeout: 30,
      allowed_num_failures: 0,
      debounce: 0,
      polymorphic_ctype_id: mapCheckType(c.type),
    }, c)

    return Check.create(data).then((saved) => {
      attachCheckToInstance(saved, savedInstance)
      attachCheckToService(saved, savedService)
    })
  })
}

const defaultChecks = ['ping']

const createDefaultChecks = (savedInstance, savedService) => {
  return defaultChecks.map(c => {
    const data = {
      name: `${savedInstance.address} ${c}`,
      active: true,
      importance: 'ERROR',
      frequency: 5,
      calculated_status: 'failed',
      verify_ssl_certificate: true,
      status_code: '200',
      timeout: 30,
      allowed_num_failures: 0,
      debounce: 0,
      polymorphic_ctype_id: mapCheckType(c.type),
    }

    return Check.create(data).then((saved) => {
      attachCheckToInstance(saved, savedInstance)
      attachCheckToService(saved, savedService)
    })
  })
}

/*
  tabelas de ligação
*/
const attachInstanceToService = (instance, service) => {
  const data = {
    instance_id: instance.get('id'),
    service_id: service.get('id'),
  }
  return ServiceInstance.create(data)
}

const attachCheckToInstance = (check, instance) => {
  const data = {
    statuscheck_id: check.get('id'),
    instance_id: instance.get('id'),
  }
  return InstanceCheck.create(data)
}

const attachCheckToService = (check, service) => {
  const data = {
    statuscheck_id: check.get('id'),
    service_id: service.get('id'),
  }
  return ServiceCheck.create(data)
}

/*
  tabelas de dados
*/
const createInstances = (dataService, savedService) => {
  return dataService.instances.map(i => {
    const data = _.merge({
      name: `${i.address}`,
      runbook_link: '',
      overall_status: 'FAILED',
      old_overall_status: 'FAILED',

      sms_alert: false,
      email_alert: false,
      hipchat_alert: false,
      alerts_enabled: false,
      telephone_alert: false,
    }, i)

    return Instance.create(data).then((saved) => {
      attachInstanceToService(saved, savedService)
      createChecks(data, saved, savedService)
      createDefaultChecks(saved, savedService)
    })
  })
}

const createServices = (dataConfig) => {
  return dataConfig.services.forEach(s => {
    const data = _.merge({
      url: '',
      runbook_link: '',
      overall_status: 'failed',
      old_overall_status: 'failed',

      sms_alert: false,
      email_alert: false,
      hipchat_alert: false,
      alerts_enabled: true,
      telephone_alert: false,
    }, s)

    return Service.create(data).then((saved) => {
      createInstances(data, saved)
    })
  })
}

const configCabotDb = (config) => {
  const sequelize = new Sequelize(config.connectionString)
  initModels(sequelize)
  createServices(config.data)
}

module.exports = configCabotDb
