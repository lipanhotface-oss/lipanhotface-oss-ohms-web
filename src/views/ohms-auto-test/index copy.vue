<template>
  <div class="script-platform">
    <!-- 左侧菜单栏 -->
    <div class="menu-sidebar">
      <div class="sidebar-header">
        <h3><i class="el-icon-s-platform"></i> 模块</h3>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="menu-list"
        @select="handleMenuSelect"
      >
        <el-menu-item
          v-for="menu in menus"
          :key="menu.id"
          :index="menu.id"
          :class="{ 'active-menu': activeMenu === menu.id }"
        >
          <i :class="menu.icon"></i>
          <span slot="title">{{ menu.name }}</span>
          <el-badge
            v-if="getFunctionCount(menu.id) > 0"
            :value="getFunctionCount(menu.id)"
            class="menu-badge"
          />
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <el-button
          type="text"
          icon="el-icon-refresh"
          @click="refreshData"
        >
          刷新
        </el-button>
        <el-button
          type="text"
          icon="el-icon-setting"
          @click="showSettings = true"
        >
          设置
        </el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 功能选择区域 -->
      <div v-if="!selectedFunction" class="function-selection">
        <div class="function-header">
          <h2>{{ getCurrentMenuName() }} - 功能列表</h2>
          <el-button
            type="primary"
            icon="el-icon-plus"
            @click="showImportDialog = true"
          >
            导入脚本
          </el-button>
        </div>

        <div class="function-grid">
          <el-card
            v-for="func in functions"
            :key="func.id"
            class="function-card"
            shadow="hover"
            @click.native="selectFunction(func)"
          >
            <div class="function-card-content">
              <div class="function-icon">
                <i class="el-icon-s-promotion"></i>
              </div>
              <div class="function-info">
                <h4>{{ func.name }}</h4>
                <p class="function-desc">{{ func.description || '暂无描述' }}</p>
                <div class="function-meta">
                  <el-tag size="mini" type="info">
                    {{ getScriptFileName(func.script) }}
                  </el-tag>
                  <span class="function-path">{{ func.script }}</span>
                </div>
              </div>
              <div class="function-actions">
                <el-button
                  type="text"
                  icon="el-icon-edit"
                  @click.stop="editFunction(func)"
                >
                  编辑
                </el-button>
                <el-button
                  type="text"
                  icon="el-icon-video-play"
                  @click.stop="executeFunction(func)"
                >
                  运行
                </el-button>
              </div>
            </div>
          </el-card>

          <!-- 添加新功能卡片 -->
          <el-card
            class="function-card add-card"
            shadow="hover"
            @click.native="addNewFunction"
          >
            <div class="add-function">
              <i class="el-icon-plus"></i>
              <p>添加新功能</p>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 脚本编辑/执行区域 -->
      <div v-else class="script-workspace">
        <div class="workspace-header">
          <el-button
            icon="el-icon-back"
            @click="selectedFunction = null"
          >
            返回功能列表
          </el-button>

          <div class="function-title">
            <h2>{{ selectedFunction.name }}</h2>
            <el-tag type="info">{{ selectedFunction.script }}</el-tag>
          </div>

          <div class="workspace-actions">
            <el-button-group>
              <el-button
                type="primary"
                icon="el-icon-document-checked"
                @click="saveScript"
                :loading="saving"
              >
                保存脚本
              </el-button>
              <el-button
                type="success"
                icon="el-icon-video-play"
                @click="executeScript"
                :loading="executing"
              >
                执行脚本
              </el-button>
            </el-button-group>

            <el-dropdown @command="handleMoreActions">
              <el-button type="text">
                更多操作<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="download">下载脚本</el-dropdown-item>
                <el-dropdown-item command="duplicate">复制功能</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除功能</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>

        <div class="workspace-content">
          <!-- 参数配置区域 -->
          <div v-if="selectedFunction.parameters" class="parameter-section">
            <el-card class="parameter-card">
              <div slot="header">
                <span>运行参数</span>
                <el-button
                  type="text"
                  @click="parameterCollapsed = !parameterCollapsed"
                >
                  {{ parameterCollapsed ? '展开' : '收起' }}
                </el-button>
              </div>
              <div v-if="!parameterCollapsed">
                <el-form
                  :model="parameters"
                  label-width="100px"
                  size="small"
                >
                  <el-form-item
                    v-for="param in selectedFunction.parameters"
                    :key="param.name"
                    :label="param.label || param.name"
                    :required="param.required"
                  >
                    <el-input
                      v-if="param.type === 'string'"
                      v-model="parameters[param.name]"
                      :placeholder="`请输入${param.label}`"
                    />
                    <el-input-number
                      v-else-if="param.type === 'number'"
                      v-model="parameters[param.name]"
                      :placeholder="`请输入${param.label}`"
                    />
                    <el-switch
                      v-else-if="param.type === 'boolean'"
                      v-model="parameters[param.name]"
                      :active-text="param.label"
                    />
                    <el-select
                      v-else-if="param.type === 'select'"
                      v-model="parameters[param.name]"
                      :placeholder="`请选择${param.label}`"
                    >
                      <el-option
                        v-for="option in param.options"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-form>

                <div class="parameter-actions">
                  <el-button @click="resetParameters">重置参数</el-button>
                  <el-button type="primary" @click="saveParameters">
                    保存参数模板
                  </el-button>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 代码编辑器和输出区域 -->
          <div class="editor-output-section">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card class="editor-card">
                  <div slot="header">
                    <span>脚本编辑器</span>
                    <div class="editor-actions">
                      <el-button
                        type="text"
                        icon="el-icon-refresh"
                        @click="loadScriptContent"
                      >
                        重新加载
                      </el-button>
                      <el-button
                        type="text"
                        icon="el-icon-folder-opened"
                        @click="formatCode"
                      >
                        格式化
                      </el-button>
                    </div>
                  </div>

                  <!-- 代码编辑器 -->
                  <codemirror
                    ref="editor"
                    v-model="scriptContent"
                    :options="editorOptions"
                    @input="onContentChange"
                  />

                  <div class="editor-footer">
                    <el-tag size="small">
                      长度: {{ scriptContent.length }} 字符
                    </el-tag>
                    <el-tag
                      size="small"
                      :type="contentModified ? 'warning' : 'success'"
                    >
                      {{ contentModified ? '已修改' : '已保存' }}
                    </el-tag>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card class="output-card">
                  <div slot="header">
                    <span>执行输出</span>
                    <div class="output-actions">
                      <el-button
                        type="text"
                        icon="el-icon-delete"
                        @click="clearOutput"
                      >
                        清空
                      </el-button>
                      <el-button
                        type="text"
                        icon="el-icon-download"
                        @click="downloadOutput"
                      >
                        下载
                      </el-button>
                    </div>
                  </div>

                  <!-- 输出区域 -->
                  <div class="output-container">
                    <pre
                      ref="outputRef"
                      class="output-content"
                      :class="{ 'executing': executing }"
                    >{{ output }}</pre>

                    <div v-if="executing" class="execution-status">
                      <el-alert
                        title="正在执行..."
                        type="info"
                        :closable="false"
                        center
                      >
                        <el-button
                          size="mini"
                          type="danger"
                          @click="stopExecution"
                        >
                          停止执行
                        </el-button>
                      </el-alert>
                    </div>
                  </div>

                  <div class="output-footer">
                    <el-statistic
                      v-if="lastExecution"
                      title="执行统计"
                      :value="lastExecution.duration"
                      suffix="ms"
                    />
                    <el-tag
                      v-if="lastExecution"
                      :type="lastExecution.success ? 'success' : 'danger'"
                    >
                      {{ lastExecution.success ? '成功' : '失败' }}
                    </el-tag>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入脚本对话框 -->
    <el-dialog
      title="导入Python脚本"
      :visible.sync="showImportDialog"
      width="600px"
    >
      <el-form :model="importForm" label-width="100px">
        <el-form-item label="选择菜单">
          <el-select
            v-model="importForm.menuId"
            placeholder="请选择菜单"
            @change="onMenuSelectForImport"
          >
            <el-option
              v-for="menu in menus"
              :key="menu.id"
              :label="menu.name"
              :value="menu.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="功能名称">
          <el-input
            v-model="importForm.functionName"
            placeholder="请输入功能名称"
          />
        </el-form-item>

        <el-form-item label="脚本描述">
          <el-input
            v-model="importForm.description"
            type="textarea"
            placeholder="请输入功能描述"
          />
        </el-form-item>

        <el-form-item label="选择文件">
          <el-upload
            class="upload-demo"
            drag
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :before-upload="beforeUpload"
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <div class="el-upload__tip" slot="tip">
              只能上传.py文件，且不超过10MB
            </div>
          </el-upload>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="confirmImport"
          :disabled="!importForm.filePath"
        >
          确认导入
        </el-button>
      </span>
    </el-dialog>

    <!-- 设置对话框 -->
    <el-dialog
      title="平台设置"
      :visible.sync="showSettings"
      width="500px"
    >
      <el-form label-width="120px">
        <el-form-item label="脚本存储路径">
          <el-input
            v-model="settings.scriptsPath"
            disabled
          />
        </el-form-item>

        <el-form-item label="默认执行超时">
          <el-input-number
            v-model="settings.defaultTimeout"
            :min="1"
            :max="300"
            suffix="秒"
          />
        </el-form-item>

        <el-form-item label="自动保存">
          <el-switch v-model="settings.autoSave" />
        </el-form-item>

        <el-form-item label="保存间隔">
          <el-input-number
            v-model="settings.saveInterval"
            :min="1"
            :max="60"
            suffix="秒"
            :disabled="!settings.autoSave"
          />
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'
import 'codemirror/mode/python/python.js'
import 'codemirror/addon/selection/active-line.js'
import 'codemirror/addon/edit/matchbrackets.js'

export default {
  components: {
    codemirror
  },

  data() {
    return {
      // 菜单数据
      menus: [
        {
          'id': 'data_analysis',
          'name': 'P1',
          'icon': 'el-icon-data-analysis',
          'description': '飞机状态监控',
          'order': 1,
          'functions': [
            {
              'id': 'data_cleaning',
              'name': '飞机状态监控',
              'script': '数据分析/数据清洗.py',
              'description': '数据清洗和预处理，处理缺失值、异常值等',
              'icon': 'el-icon-folder-checked',
              'created': '2024-01-10',
              'modified': '2024-01-15',
              'author': 'admin',
              'parameters': [
                {
                  'name': 'input_file',
                  'type': 'string',
                  'required': true,
                  'label': '输入文件路径',
                  'default': './data/raw_data.csv',
                  'description': '需要清洗的数据文件路径'
                },
                {
                  'name': 'output_file',
                  'type': 'string',
                  'required': true,
                  'label': '输出文件路径',
                  'default': './data/cleaned_data.csv',
                  'description': '清洗后数据保存路径'
                },
                {
                  'name': 'missing_strategy',
                  'type': 'select',
                  'required': false,
                  'label': '缺失值处理策略',
                  'default': 'mean',
                  'options': [
                    { 'value': 'mean', 'label': '均值填充' },
                    { 'value': 'median', 'label': '中位数填充' },
                    { 'value': 'mode', 'label': '众数填充' },
                    { 'value': 'drop', 'label': '删除缺失行' }
                  ]
                }
              ]
            },
            {
              'id': 'statistical_analysis',
              'name': '统计分析',
              'script': '数据分析/统计分析.py',
              'description': '基础统计分析和描述性统计',
              'icon': 'el-icon-data-line',
              'created': '2024-01-12',
              'modified': '2024-01-18',
              'author': 'analyst1'
            },
            {
              'id': 'data_visualization',
              'name': '数据可视化',
              'script': '数据分析/数据可视化.py',
              'description': '生成各类数据可视化图表',
              'icon': 'el-icon-pie-chart',
              'created': '2024-01-15',
              'modified': '2024-01-20',
              'author': 'analyst2'
            }
          ]
        },
        {
          'id': 'automation',
          'name': 'P2',
          'icon': 'el-icon-refresh',
          'description': '自动化任务处理脚本',
          'order': 2,
          'functions': [
            {
              'id': 'file_processing',
              'name': '文件批量处理',
              'script': '自动化/文件批量处理.py',
              'description': '批量处理文件，如重命名、格式转换等',
              'icon': 'el-icon-files',
              'created': '2024-01-05',
              'modified': '2024-01-12',
              'author': 'admin'
            },
            {
              'id': 'email_sender',
              'name': '邮件自动发送',
              'script': '自动化/邮件发送.py',
              'description': '自动发送邮件，支持附件和模板',
              'icon': 'el-icon-message',
              'created': '2024-01-08',
              'modified': '2024-01-16',
              'author': 'admin',
              'parameters': [
                {
                  'name': 'recipients',
                  'type': 'string',
                  'required': true,
                  'label': '收件人邮箱',
                  'description': '多个邮箱用逗号分隔'
                },
                {
                  'name': 'subject',
                  'type': 'string',
                  'required': true,
                  'label': '邮件主题',
                  'default': '系统通知'
                },
                {
                  'name': 'content',
                  'type': 'string',
                  'required': true,
                  'label': '邮件内容',
                  'component': 'textarea',
                  'rows': 4
                }
              ]
            }
          ]
        },
        {
          'id': 'data_extract',
          'name': 'P3',
          'icon': 'el-icon-download',
          'description': '从各种数据源提取数据',
          'order': 3,
          'functions': [
            {
              'id': 'web_crawler',
              'name': '网页数据抓取',
              'script': '数据提取/网页抓取.py',
              'description': '爬取网页数据，支持动态页面',
              'icon': 'el-icon-link',
              'created': '2024-01-03',
              'modified': '2024-01-10',
              'author': 'crawler1'
            },
            {
              'id': 'api_data_fetch',
              'name': 'API数据获取',
              'script': '数据提取/API数据获取.py',
              'description': '通过API接口获取数据',
              'icon': 'el-icon-connection',
              'created': '2024-01-07',
              'modified': '2024-01-14',
              'author': 'api_user'
            }
          ]
        },
        {
          'id': 'machine_learning',
          'name': 'P4',
          'icon': 'el-icon-cpu',
          'description': '机器学习模型训练和预测',
          'order': 4,
          'functions': [
            {
              'id': 'model_training',
              'name': '模型训练',
              'script': '机器学习/模型训练.py',
              'description': '训练机器学习模型',
              'icon': 'el-icon-set-up',
              'created': '2024-01-02',
              'modified': '2024-01-09',
              'author': 'ml_engineer'
            },
            {
              'id': 'model_predict',
              'name': '模型预测',
              'script': '机器学习/模型预测.py',
              'description': '使用训练好的模型进行预测',
              'icon': 'el-icon-coin',
              'created': '2024-01-04',
              'modified': '2024-01-11',
              'author': 'ml_engineer'
            }
          ]
        },
        {
          'id': 'file_conversion',
          'name': 'P5',
          'icon': 'el-icon-s-operation',
          'description': '各种文件格式转换工具',
          'order': 5,
          'functions': [
            {
              'id': 'excel_to_csv',
              'name': 'Excel转CSV',
              'script': '文件转换/Excel转CSV.py',
              'description': '将Excel文件转换为CSV格式',
              'icon': 'el-icon-document',
              'created': '2024-01-06',
              'modified': '2024-01-13',
              'author': 'admin'
            },
            {
              'id': 'pdf_to_text',
              'name': 'PDF转文本',
              'script': '文件转换/PDF转文本.py',
              'description': '提取PDF文件中的文本内容',
              'icon': 'el-icon-document-copy',
              'created': '2024-01-09',
              'modified': '2024-01-17',
              'author': 'admin'
            }
          ]
        },
        {
          'id': 'system_tools',
          'name': 'P6',
          'icon': 'el-icon-tools',
          'description': '系统管理和维护工具',
          'order': 6,
          'functions': [
            {
              'id': 'log_analyzer',
              'name': '日志分析',
              'script': '系统工具/日志分析.py',
              'description': '分析系统日志，提取关键信息',
              'icon': 'el-icon-notebook-2',
              'created': '2024-01-11',
              'modified': '2024-01-19',
              'author': 'sys_admin'
            },
            {
              'id': 'backup_script',
              'name': '数据备份',
              'script': '系统工具/数据备份.py',
              'description': '自动备份重要数据到指定位置',
              'icon': 'el-icon-upload2',
              'created': '2024-01-14',
              'modified': '2024-01-21',
              'author': 'sys_admin',
              'parameters': [
                {
                  'name': 'source_dir',
                  'type': 'string',
                  'required': true,
                  'label': '源目录',
                  'default': '/data/important',
                  'description': '需要备份的目录路径'
                },
                {
                  'name': 'backup_dir',
                  'type': 'string',
                  'required': true,
                  'label': '备份目录',
                  'default': '/backup',
                  'description': '备份文件保存路径'
                },
                {
                  'name': 'retention_days',
                  'type': 'number',
                  'required': false,
                  'label': '保留天数',
                  'default': 30,
                  'min': 1,
                  'max': 365
                }
              ]
            }
          ]
        },
        {
          'id': 'network_tools',
          'name': 'P7',
          'icon': 'el-icon-global',
          'description': '网络相关的工具脚本',
          'order': 7,
          'functions': [
            {
              'id': 'ping_checker',
              'name': '网络连通性测试',
              'script': '网络工具/网络测试.py',
              'description': '测试网络连通性和延迟',
              'icon': 'el-icon-wind-power',
              'created': '2024-01-13',
              'modified': '2024-01-22',
              'author': 'net_admin'
            },
            {
              'id': 'port_scanner',
              'name': '端口扫描',
              'script': '网络工具/端口扫描.py',
              'description': '扫描指定主机的开放端口',
              'icon': 'el-icon-search',
              'created': '2024-01-16',
              'modified': '2024-01-24',
              'author': 'net_admin',
              'parameters': [
                {
                  'name': 'target_host',
                  'type': 'string',
                  'required': true,
                  'label': '目标主机',
                  'default': '127.0.0.1'
                },
                {
                  'name': 'start_port',
                  'type': 'number',
                  'required': false,
                  'label': '起始端口',
                  'default': 1,
                  'min': 1,
                  'max': 65535
                },
                {
                  'name': 'end_port',
                  'type': 'number',
                  'required': false,
                  'label': '结束端口',
                  'default': 1000,
                  'min': 1,
                  'max': 65535
                }
              ]
            }
          ]
        },

      ],
      functions: [],
      activeMenu: '',

      // 功能选择
      selectedFunction: null,

      // 脚本编辑
      scriptContent: '',
      contentModified: false,
      saving: false,

      // 参数配置
      parameters: {},
      parameterCollapsed: false,

      // 执行状态
      executing: false,
      output: '',
      lastExecution: null,

      // 对话框
      showImportDialog: false,
      showSettings: false,

      // 导入表单
      importForm: {
        menuId: '',
        functionName: '',
        description: '',
        filePath: ''
      },

      // 设置
      settings: {
        scriptsPath: '/scripts',
        defaultTimeout: 30,
        autoSave: true,
        saveInterval: 10
      },

      // 编辑器配置
      editorOptions: {
        tabSize: 4,
        theme: 'monokai',
        mode: 'python',
        lineNumbers: true,
        lineWrapping: true,
        styleActiveLine: true,
        matchBrackets: true,
        extraKeys: {
          'Ctrl-S': () => this.saveScript(),
          'F5': () => this.executeScript(),
          'Ctrl-/': 'toggleComment',
          'Tab': 'indentMore',
          'Shift-Tab': 'indentLess'
        }
      },

      // WebSocket连接
      ws: null,
      autoSaveTimer: null
    }
  },

  computed: {
    // 获取当前菜单名称
    getCurrentMenuName() {
      return () => {
        const menu = this.menus.find(m => m.id === this.activeMenu)
        return menu ? menu.name : '选择菜单'
      }
    },

    // 获取菜单下的功能数量
    getFunctionCount() {
      return (menuId) => {
        const menu = this.menus.find(m => m.id === menuId)
        console.log(111111111, menu);

        return menu ? menu.functions.length : 0
      }
    },

    // 上传URL和头部
    uploadUrl() {
      return `${this.$baseUrl}/api/scripts/import`
    },

    uploadHeaders() {
      const token = localStorage.getItem('token')
      return {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    }
  },

  watch: {
    // 监听自动保存设置
    'settings.autoSave': function(newVal) {
      if (newVal && this.settings.saveInterval > 0) {
        this.startAutoSave()
      } else {
        this.stopAutoSave()
      }
    },

    // 监听内容修改
    scriptContent() {
      if (!this.contentModified) {
        this.contentModified = true
      }
    }
  },

  async mounted() {
    await this.loadMenus()

    // 默认选择第一个菜单
    if (this.menus.length > 0 && !this.activeMenu) {
      this.activeMenu = this.menus[0].id
      await this.loadFunctions(this.activeMenu)
    }

    // 加载设置
    this.loadSettings()

    // 启动自动保存
    if (this.settings.autoSave) {
      this.startAutoSave()
    }
  },

  beforeDestroy() {
    this.stopAutoSave()
    if (this.ws) {
      this.ws.close()
    }
  },

  methods: {
    // 加载菜单数据
    async loadMenus() {
      this.menus = [
        {
          'id': 'data_analysis',
          'name': 'P1',
          'icon': 'el-icon-data-analysis',
          'description': '飞机状态监控',
          'order': 1,
          'functions': [
            {
              'id': 'data_cleaning',
              'name': '飞机状态监控',
              'script': '数据分析/数据清洗.py',
              'description': '数据清洗和预处理，处理缺失值、异常值等',
              'icon': 'el-icon-folder-checked',
              'created': '2024-01-10',
              'modified': '2024-01-15',
              'author': 'admin',
              'parameters': [
                {
                  'name': 'input_file',
                  'type': 'string',
                  'required': true,
                  'label': '输入文件路径',
                  'default': './data/raw_data.csv',
                  'description': '需要清洗的数据文件路径'
                },
                {
                  'name': 'output_file',
                  'type': 'string',
                  'required': true,
                  'label': '输出文件路径',
                  'default': './data/cleaned_data.csv',
                  'description': '清洗后数据保存路径'
                },
                {
                  'name': 'missing_strategy',
                  'type': 'select',
                  'required': false,
                  'label': '缺失值处理策略',
                  'default': 'mean',
                  'options': [
                    { 'value': 'mean', 'label': '均值填充' },
                    { 'value': 'median', 'label': '中位数填充' },
                    { 'value': 'mode', 'label': '众数填充' },
                    { 'value': 'drop', 'label': '删除缺失行' }
                  ]
                }
              ]
            },
            {
              'id': 'statistical_analysis',
              'name': '统计分析',
              'script': '数据分析/统计分析.py',
              'description': '基础统计分析和描述性统计',
              'icon': 'el-icon-data-line',
              'created': '2024-01-12',
              'modified': '2024-01-18',
              'author': 'analyst1'
            },
            {
              'id': 'data_visualization',
              'name': '数据可视化',
              'script': '数据分析/数据可视化.py',
              'description': '生成各类数据可视化图表',
              'icon': 'el-icon-pie-chart',
              'created': '2024-01-15',
              'modified': '2024-01-20',
              'author': 'analyst2'
            }
          ]
        },
        {
          'id': 'automation',
          'name': 'P2',
          'icon': 'el-icon-refresh',
          'description': '自动化任务处理脚本',
          'order': 2,
          'functions': [
            {
              'id': 'file_processing',
              'name': '文件批量处理',
              'script': '自动化/文件批量处理.py',
              'description': '批量处理文件，如重命名、格式转换等',
              'icon': 'el-icon-files',
              'created': '2024-01-05',
              'modified': '2024-01-12',
              'author': 'admin'
            },
            {
              'id': 'email_sender',
              'name': '邮件自动发送',
              'script': '自动化/邮件发送.py',
              'description': '自动发送邮件，支持附件和模板',
              'icon': 'el-icon-message',
              'created': '2024-01-08',
              'modified': '2024-01-16',
              'author': 'admin',
              'parameters': [
                {
                  'name': 'recipients',
                  'type': 'string',
                  'required': true,
                  'label': '收件人邮箱',
                  'description': '多个邮箱用逗号分隔'
                },
                {
                  'name': 'subject',
                  'type': 'string',
                  'required': true,
                  'label': '邮件主题',
                  'default': '系统通知'
                },
                {
                  'name': 'content',
                  'type': 'string',
                  'required': true,
                  'label': '邮件内容',
                  'component': 'textarea',
                  'rows': 4
                }
              ]
            }
          ]
        },
        {
          'id': 'data_extract',
          'name': 'P3',
          'icon': 'el-icon-download',
          'description': '从各种数据源提取数据',
          'order': 3,
          'functions': [
            {
              'id': 'web_crawler',
              'name': '网页数据抓取',
              'script': '数据提取/网页抓取.py',
              'description': '爬取网页数据，支持动态页面',
              'icon': 'el-icon-link',
              'created': '2024-01-03',
              'modified': '2024-01-10',
              'author': 'crawler1'
            },
            {
              'id': 'api_data_fetch',
              'name': 'API数据获取',
              'script': '数据提取/API数据获取.py',
              'description': '通过API接口获取数据',
              'icon': 'el-icon-connection',
              'created': '2024-01-07',
              'modified': '2024-01-14',
              'author': 'api_user'
            }
          ]
        },
        {
          'id': 'machine_learning',
          'name': 'P4',
          'icon': 'el-icon-cpu',
          'description': '机器学习模型训练和预测',
          'order': 4,
          'functions': [
            {
              'id': 'model_training',
              'name': '模型训练',
              'script': '机器学习/模型训练.py',
              'description': '训练机器学习模型',
              'icon': 'el-icon-set-up',
              'created': '2024-01-02',
              'modified': '2024-01-09',
              'author': 'ml_engineer'
            },
            {
              'id': 'model_predict',
              'name': '模型预测',
              'script': '机器学习/模型预测.py',
              'description': '使用训练好的模型进行预测',
              'icon': 'el-icon-coin',
              'created': '2024-01-04',
              'modified': '2024-01-11',
              'author': 'ml_engineer'
            }
          ]
        },
        {
          'id': 'file_conversion',
          'name': 'P5',
          'icon': 'el-icon-s-operation',
          'description': '各种文件格式转换工具',
          'order': 5,
          'functions': [
            {
              'id': 'excel_to_csv',
              'name': 'Excel转CSV',
              'script': '文件转换/Excel转CSV.py',
              'description': '将Excel文件转换为CSV格式',
              'icon': 'el-icon-document',
              'created': '2024-01-06',
              'modified': '2024-01-13',
              'author': 'admin'
            },
            {
              'id': 'pdf_to_text',
              'name': 'PDF转文本',
              'script': '文件转换/PDF转文本.py',
              'description': '提取PDF文件中的文本内容',
              'icon': 'el-icon-document-copy',
              'created': '2024-01-09',
              'modified': '2024-01-17',
              'author': 'admin'
            }
          ]
        },
        {
          'id': 'system_tools',
          'name': 'P6',
          'icon': 'el-icon-tools',
          'description': '系统管理和维护工具',
          'order': 6,
          'functions': [
            {
              'id': 'log_analyzer',
              'name': '日志分析',
              'script': '系统工具/日志分析.py',
              'description': '分析系统日志，提取关键信息',
              'icon': 'el-icon-notebook-2',
              'created': '2024-01-11',
              'modified': '2024-01-19',
              'author': 'sys_admin'
            },
            {
              'id': 'backup_script',
              'name': '数据备份',
              'script': '系统工具/数据备份.py',
              'description': '自动备份重要数据到指定位置',
              'icon': 'el-icon-upload2',
              'created': '2024-01-14',
              'modified': '2024-01-21',
              'author': 'sys_admin',
              'parameters': [
                {
                  'name': 'source_dir',
                  'type': 'string',
                  'required': true,
                  'label': '源目录',
                  'default': '/data/important',
                  'description': '需要备份的目录路径'
                },
                {
                  'name': 'backup_dir',
                  'type': 'string',
                  'required': true,
                  'label': '备份目录',
                  'default': '/backup',
                  'description': '备份文件保存路径'
                },
                {
                  'name': 'retention_days',
                  'type': 'number',
                  'required': false,
                  'label': '保留天数',
                  'default': 30,
                  'min': 1,
                  'max': 365
                }
              ]
            }
          ]
        },
        {
          'id': 'network_tools',
          'name': 'P7',
          'icon': 'el-icon-global',
          'description': '网络相关的工具脚本',
          'order': 7,
          'functions': [
            {
              'id': 'ping_checker',
              'name': '网络连通性测试',
              'script': '网络工具/网络测试.py',
              'description': '测试网络连通性和延迟',
              'icon': 'el-icon-wind-power',
              'created': '2024-01-13',
              'modified': '2024-01-22',
              'author': 'net_admin'
            },
            {
              'id': 'port_scanner',
              'name': '端口扫描',
              'script': '网络工具/端口扫描.py',
              'description': '扫描指定主机的开放端口',
              'icon': 'el-icon-search',
              'created': '2024-01-16',
              'modified': '2024-01-24',
              'author': 'net_admin',
              'parameters': [
                {
                  'name': 'target_host',
                  'type': 'string',
                  'required': true,
                  'label': '目标主机',
                  'default': '127.0.0.1'
                },
                {
                  'name': 'start_port',
                  'type': 'number',
                  'required': false,
                  'label': '起始端口',
                  'default': 1,
                  'min': 1,
                  'max': 65535
                },
                {
                  'name': 'end_port',
                  'type': 'number',
                  'required': false,
                  'label': '结束端口',
                  'default': 1000,
                  'min': 1,
                  'max': 65535
                }
              ]
            }
          ]
        }

      ]
      console.log(this.menus)

      // try {
      //   const response = await this.$http.get('/api/scripts/menus')
      //   if (response.data.success) {
      //     this.menus = response.data.data
      //   }
      // } catch (error) {
      //   this.$message.error('加载菜单失败: ' + error.message)
      // }
    },

    // 加载功能列表
    async loadFunctions(menuId) {
      this.functions = []
      // try {
      //   const response = await this.$http.get('/api/scripts/functions', {
      //     params: { menuId }
      //   })
      //   if (response.data.success) {
      //     this.functions = response.data.data
      //   }
      // } catch (error) {
      //   this.$message.error('加载功能列表失败: ' + error.message)
      // }
    },

    // 选择菜单
    async handleMenuSelect(menuId) {
      this.activeMenu = menuId
      await this.loadFunctions(menuId)
      this.selectedFunction = null
    },

    // 选择功能
    async selectFunction(func) {
      this.selectedFunction = func
      await this.loadScriptContent()
      this.resetParameters()
    },

    // 加载脚本内容
    async loadScriptContent() {
      if (!this.selectedFunction) return

      try {
        const response = await this.$http.get('/api/scripts/content', {
          params: { scriptPath: this.selectedFunction.script }
        })
        if (response.data.success) {
          this.scriptContent = response.data.data
          this.contentModified = false
        }
      } catch (error) {
        this.$message.error('加载脚本失败: ' + error.message)
      }
    },

    // 保存脚本
    async saveScript() {
      if (!this.selectedFunction) return

      this.saving = true
      try {
        const response = await this.$http.post('/api/scripts/save', {
          scriptPath: this.selectedFunction.script,
          content: this.scriptContent
        })

        if (response.data.success) {
          this.contentModified = false
          this.$message.success('保存成功')
        }
      } catch (error) {
        this.$message.error('保存失败: ' + error.message)
      } finally {
        this.saving = false
      }
    },

    // 执行脚本
    async executeScript() {
      if (this.executing) {
        this.$message.warning('请等待当前执行完成')
        return
      }

      this.executing = true
      this.output = ''
      const startTime = Date.now()

      try {
        // 构建执行参数
        const params = {
          code: this.scriptContent,
          timeout: this.settings.defaultTimeout * 1000,
          parameters: this.parameters
        }

        // 创建WebSocket连接
        this.ws = new WebSocket(`ws://${window.location.host}/api/python/ws`)

        this.ws.onopen = () => {
          this.ws.send(JSON.stringify(params))
        }

        this.ws.onmessage = (event) => {
          this.output += event.data
          this.$nextTick(() => {
            this.scrollOutputToBottom()
          })
        }

        this.ws.onclose = () => {
          this.executing = false
          const duration = Date.now() - startTime

          this.lastExecution = {
            duration,
            success: !this.output.includes('[ERROR]'),
            timestamp: new Date().toLocaleString()
          }

          this.$message.success('执行完成')
        }
      } catch (error) {
        this.executing = false
        this.$message.error('执行失败: ' + error.message)
      }
    },

    // 停止执行
    stopExecution() {
      if (this.ws) {
        this.ws.close()
      }
      this.executing = false
      this.output += '\n[用户中断] 执行已停止'
    },

    // 清空输出
    clearOutput() {
      this.output = ''
      this.lastExecution = null
    },

    // 滚动输出到底部
    scrollOutputToBottom() {
      const container = this.$refs.outputRef
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    },

    // 重置参数
    resetParameters() {
      if (!this.selectedFunction || !this.selectedFunction.parameters) {
        this.parameters = {}
        return
      }

      this.parameters = {}
      this.selectedFunction.parameters.forEach(param => {
        this.parameters[param.name] = param.default || ''
      })
    },

    // 导入脚本相关方法
    onMenuSelectForImport(menuId) {
      // 自动生成功能ID
      // const menu = this.menus.find(m => m.id === menuId)
      // if (menu && this.importForm.functionName) {
      //   const funcId = this.importForm.functionName
      //     .toLowerCase()
      //     .replace(/\s+/g, '_')
      //     .replace(/[^\w]/g, '')

      //   // 生成脚本路径
      //   const scriptPath = `${menu.name}/${this.importForm.functionName}.py`
      //   this.importForm.scriptPath = scriptPath
      // }
    },

    // 文件上传前检查
    beforeUpload(file) {
      const isPython = file.name.endsWith('.py')
      const isLt10M = file.size / 1024 / 1024 < 10

      if (!isPython) {
        this.$message.error('只能上传Python文件!')
        return false
      }
      if (!isLt10M) {
        this.$message.error('文件大小不能超过10MB!')
        return false
      }
      return true
    },

    // 上传成功处理
    handleUploadSuccess(response) {
      if (response.success) {
        this.importForm.filePath = response.data
        this.$message.success('文件上传成功')
      } else {
        this.$message.error(response.message)
      }
    },

    // 确认导入
    async confirmImport() {
      // 这里需要调用后端API将脚本添加到配置中
      // 由于配置管理较复杂，这里只提供前端交互

      this.$message.success('导入成功（前端演示）')
      this.showImportDialog = false
      await this.loadFunctions(this.activeMenu)
    },

    // 添加新功能
    addNewFunction() {
      this.importForm = {
        menuId: this.activeMenu,
        functionName: '',
        description: '',
        filePath: ''
      }
      this.showImportDialog = true
    },

    // 编辑功能
    editFunction(func) {
      // 这里可以打开功能编辑对话框
      this.$message.info('功能编辑功能开发中')
    },

    // 执行功能
    executeFunction(func) {
      this.selectedFunction = func
      this.$nextTick(() => {
        this.executeScript()
      })
    },

    // 更多操作
    handleMoreActions(command) {
      switch (command) {
        case 'download':
          this.downloadScript()
          break
        case 'duplicate':
          this.duplicateFunction()
          break
        case 'delete':
          this.deleteFunction()
          break
      }
    },

    // 下载脚本
    downloadScript() {
      if (!this.selectedFunction) return

      const blob = new Blob([this.scriptContent], { type: 'text/x-python' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = this.getScriptFileName(this.selectedFunction.script)
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },

    // 下载输出
    downloadOutput() {
      const blob = new Blob([this.output], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `output_${new Date().getTime()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },

    // 获取脚本文件名
    getScriptFileName(path) {
      return path.split('/').pop()
    },

    // 格式化代码
    formatCode() {
      // 这里可以添加代码格式化逻辑
      this.$message.info('代码格式化功能开发中')
    },

    // 启动自动保存
    startAutoSave() {
      this.stopAutoSave()
      this.autoSaveTimer = setInterval(() => {
        if (this.contentModified && this.selectedFunction) {
          this.saveScript()
        }
      }, this.settings.saveInterval * 1000)
    },

    // 停止自动保存
    stopAutoSave() {
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer)
        this.autoSaveTimer = null
      }
    },

    // 加载设置
    loadSettings() {
      const saved = localStorage.getItem('script_platform_settings')
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) }
      }
    },

    // 保存设置
    saveSettings() {
      localStorage.setItem('script_platform_settings', JSON.stringify(this.settings))
      this.$message.success('设置已保存')
      this.showSettings = false
    },

    // 刷新数据
    async refreshData() {
      await this.loadMenus()
      if (this.activeMenu) {
        await this.loadFunctions(this.activeMenu)
      }
      this.$message.success('数据已刷新')
    },

    // 内容变化处理
    onContentChange() {
      this.contentModified = true
    }
  }
}
</script>

<style scoped>
.script-platform {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.menu-sidebar {
  width: 100px;
  background: #3f4b59;
  color: #bfcbd9;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #263445;
}

.sidebar-header h3 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu-list {
  flex: 1;
  border: none;
  background: transparent;
}

.menu-list >>> .el-menu-item {
  color: #bfcbd9;
  height: 56px;
  line-height: 56px;
  position: relative;
}

.menu-list >>> .el-menu-item:hover {
  background-color: #263445 !important;
}

.menu-list >>> .el-menu-item.is-active {
  background-color: #1f2d3d !important;
  color: #409eff;
}

.menu-badge {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.sidebar-footer {
  padding: 15px;
  border-top: 1px solid #263445;
  display: flex;
  justify-content: space-around;
}

.sidebar-footer >>> .el-button {
  color: #bfcbd9;
}

.main-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
  background: #f0f2f5;
}

.function-selection {
  height: 100%;
}

.function-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e6e6e6;
}

.function-header h2 {
  margin: 0;
  color: #333;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.function-card {
  cursor: pointer;
  transition: all 0.3s;
}

.function-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.function-card-content {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.function-icon {
  width: 48px;
  height: 48px;
  background: #409eff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.function-info {
  flex: 1;
}

.function-info h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
}

.function-desc {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}

.function-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.function-path {
  font-size: 11px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.function-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.add-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  color: #999;
  border: 2px dashed #dcdfe6;
}

.add-card:hover {
  border-color: #409eff;
  color: #409eff;
}

.add-function {
  text-align: center;
}

.add-function i {
  font-size: 48px;
  margin-bottom: 10px;
  display: block;
}

.workspace-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e6e6e6;
}

.function-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
}

.function-title h2 {
  margin: 0;
}

.workspace-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.workspace-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.parameter-card >>> .el-card__header {
  padding: 12px 20px;
}

.parameter-card >>> .el-card__body {
  padding: 20px;
}

.parameter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e6e6e6;
}

.editor-output-section {
  flex: 1;
}

.editor-card, .output-card {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.editor-card  .el-card__header,
.output-card  .el-card__header {
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-card  .el-card__body,
.output-card  .el-card__body {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.editor-actions, .output-actions {
  display: flex;
  gap: 10px;
}

 .CodeMirror {
  flex: 1;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
}

.editor-footer {
  padding: 10px 20px;
  border-top: 1px solid #e6e6e6;
  display: flex;
  gap: 10px;
}

.output-container {
  flex: 1;
  padding: 20px;
  background: #1e1e1e;
  overflow: auto;
  position: relative;
}

.output-content {
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  margin: 0;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 100%;
}

.execution-status {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
}

.output-footer {
  padding: 10px 20px;
  border-top: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-demo >>> .el-upload {
  width: 100%;
}

.upload-demo >>> .el-upload-dragger {
  width: 100%;
  height: 150px;
}
</style>
