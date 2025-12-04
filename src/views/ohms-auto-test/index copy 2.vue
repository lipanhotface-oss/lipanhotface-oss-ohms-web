<template>
  <div class="script-platform">
    <!-- 左侧树形菜单栏 -->
    <div class="menu-sidebar">
      <div class="sidebar-header">
        <h3><i class="el-icon-s-platform"></i> 脚本模块</h3>
      </div>

      <el-scrollbar class="menu-scrollbar">
        <el-tree
          ref="menuTree"
          :data="treeMenus"
          :props="treeProps"
          node-key="id"
          default-expand-all
          highlight-current
          :expand-on-click-node="false"
          @node-click="handleNodeClick"
        >
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <span class="tree-node-content">
              <i :class="data.icon || getNodeIcon(node)"></i>
              <span class="tree-node-label">{{ data.name }}</span>
              <el-badge
                v-if="data.type === 'menu' && getMenuFunctionCount(data.id) > 0"
                :value="getMenuFunctionCount(data.id)"
                class="tree-node-badge"
              />
            </span>
          </span>
        </el-tree>
      </el-scrollbar>

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
      <!-- 顶部执行控制区域 -->
      <div class="execution-control">
        <el-card shadow="never">
          <div class="control-header">
            <h3>执行控制台</h3>
            <div class="control-actions">
              <el-button
                type="primary"
                icon="el-icon-video-play"
                @click="startExecution"
                :loading="executing"
                :disabled="selectedFunctions.length === 0"
              >
                开始执行 ({{ selectedFunctions.length }})
              </el-button>
              <el-button
                type="danger"
                icon="el-icon-switch-button"
                @click="stopExecution"
                :disabled="!executing"
              >
                停止执行
              </el-button>
              <el-button
                type="info"
                icon="el-icon-delete"
                @click="clearConsole"
              >
                清空控制台
              </el-button>
            </div>
          </div>

          <div class="execution-config">
            <el-form :model="executionConfig" label-width="100px" size="small">
              <el-row :gutter="20">
                <el-col :span="6">
                  <el-form-item label="循环次数">
                    <el-input-number
                      v-model="executionConfig.loopCount"
                      :min="1"
                      :max="1000"
                      :step="1"
                      controls-position="right"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="间隔(秒)">
                    <el-input-number
                      v-model="executionConfig.interval"
                      :min="1"
                      :max="3600"
                      :step="1"
                      controls-position="right"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="超时时间">
                    <el-input-number
                      v-model="executionConfig.timeout"
                      :min="1"
                      :max="3600"
                      :step="1"
                      controls-position="right"
                    />
                    <span style="margin-left: 5px">秒</span>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="失败继续">
                    <el-switch
                      v-model="executionConfig.continueOnError"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="执行顺序">
                <el-radio-group v-model="executionConfig.executionOrder">
                  <el-radio label="sequential">顺序执行</el-radio>
                  <el-radio label="parallel">并行执行</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-form>
          </div>

          <div class="execution-stats">
            <el-row :gutter="20">
              <el-col :span="4">
                <div class="stat-item">
                  <div class="stat-label">待执行</div>
                  <div class="stat-value">{{ selectedFunctions.length }}</div>
                </div>
              </el-col>
              <el-col :span="4">
                <div class="stat-item">
                  <div class="stat-label">成功</div>
                  <div class="stat-value success">{{ stats.success }}</div>
                </div>
              </el-col>
              <el-col :span="4">
                <div class="stat-item">
                  <div class="stat-label">失败</div>
                  <div class="stat-value error">{{ stats.failed }}</div>
                </div>
              </el-col>
              <el-col :span="4">
                <div class="stat-item">
                  <div class="stat-label">进行中</div>
                  <div class="stat-value processing">{{ stats.processing }}</div>
                </div>
              </el-col>
              <el-col :span="4">
                <div class="stat-item">
                  <div class="stat-label">总耗时</div>
                  <div class="stat-value">{{ formatDuration(stats.totalTime) }}</div>
                </div>
              </el-col>
              <el-col :span="4">
                <div class="stat-item">
                  <div class="stat-label">进度</div>
                  <div class="stat-value">
                    <el-progress
                      :percentage="stats.progress"
                      :show-text="false"
                      :stroke-width="8"
                    />
                    {{ stats.progress }}%
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </div>

      <!-- 中间表格区域 -->
      <div class="table-section">
        <el-card shadow="never" class="table-card">
          <div slot="header" class="table-header">
            <span>脚本列表 ({{ selectedFunctions.length }}个已选择)</span>
            <div class="table-actions">
              <el-button
                size="small"
                icon="el-icon-download"
                @click="exportSelection"
              >
                导出选择
              </el-button>
              <el-button
                size="small"
                icon="el-icon-delete"
                @click="clearSelection"
                :disabled="selectedFunctions.length === 0"
              >
                清空选择
              </el-button>
            </div>
          </div>

          <el-table
            ref="functionTable"
            :data="functions"
            style="width: 100%"
            height="400"
            @selection-change="handleSelectionChange"
          >
            <el-table-column
              type="selection"
              width="55"
            />
            <el-table-column
              prop="name"
              label="脚本名称"
              width="200"
            >
              <template slot-scope="{ row }">
                <div class="script-name-cell">
                  <i :class="row.icon || 'el-icon-s-promotion'"></i>
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              prop="description"
              label="描述"
              width="300"
              show-overflow-tooltip
            />
            <el-table-column
              prop="script"
              label="脚本路径"
              show-overflow-tooltip
            />
            <el-table-column
              prop="status"
              label="状态"
              width="100"
            >
              <template slot-scope="{ row }">
                <el-tag
                  size="small"
                  :type="getStatusType(row.status)"
                >
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              width="150"
              fixed="right"
            >
              <template slot-scope="{ row }">
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-view"
                  @click="viewScript(row)"
                >
                  查看
                </el-button>
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-edit"
                  @click="editScript(row)"
                >
                  编辑
                </el-button>
                <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-video-play"
                  @click="executeSingleScript(row)"
                >
                  执行
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 下方控制台区域 -->
      <div class="console-section">
        <el-card shadow="never" class="console-card">
          <div slot="header" class="console-header">
            <span>执行控制台</span>
            <div class="console-actions">
              <el-button
                size="small"
                type="text"
                icon="el-icon-copy-document"
                @click="copyConsoleContent"
              >
                复制
              </el-button>
              <el-button
                size="small"
                type="text"
                icon="el-icon-download"
                @click="downloadConsoleLog"
              >
                下载日志
              </el-button>
            </div>
          </div>

          <div class="console-content">
            <pre
              ref="consoleContent"
              class="console-output"
              :class="{ 'executing': executing }"
            >{{ consoleOutput }}</pre>

            <div v-if="executing" class="console-status">
              <el-alert
                :title="`正在执行 ${currentExecutionIndex + 1}/${totalExecutions}`"
                type="info"
                :closable="false"
                center
              >
                <template slot="title">
                  <i class="el-icon-loading"></i>
                  正在执行 {{ currentExecutionIndex + 1 }}/{{ totalExecutions }}
                  ({{ currentExecutionName }})
                </template>
              </el-alert>
            </div>
          </div>

          <div class="console-footer">
            <el-input
              v-model="consoleInput"
              placeholder="输入命令..."
              size="small"
              @keyup.enter="handleConsoleCommand"
            >
              <el-button
                slot="append"
                icon="el-icon-position"
                @click="handleConsoleCommand"
              />
            </el-input>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 脚本编辑对话框 -->
    <el-dialog
      title="脚本编辑"
      :visible.sync="showScriptDialog"
      width="80%"
      top="5vh"
    >
      <div v-if="currentScript">
        <div class="script-dialog-header">
          <h3>{{ currentScript.name }}</h3>
          <el-tag type="info">{{ currentScript.script }}</el-tag>
        </div>

        <el-row :gutter="20">
          <el-col :span="16">
            <el-card shadow="never">
              <div slot="header">
                <span>脚本内容</span>
                <div class="editor-actions">
                  <el-button
                    type="text"
                    icon="el-icon-refresh"
                    @click="reloadScript"
                  >
                    重新加载
                  </el-button>
                  <el-button
                    type="text"
                    icon="el-icon-document-checked"
                    @click="saveEditedScript"
                  >
                    保存
                  </el-button>
                </div>
              </div>
              <codemirror
                ref="scriptEditor"
                v-model="editedScriptContent"
                :options="editorOptions"
              />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never">
              <div slot="header">
                <span>参数配置</span>
              </div>
              <el-form
                v-if="currentScript.parameters"
                :model="scriptParameters"
                label-width="120px"
                size="small"
              >
                <el-form-item
                  v-for="param in currentScript.parameters"
                  :key="param.name"
                  :label="param.label"
                  :required="param.required"
                >
                  <component
                    :is="getParameterComponent(param.type)"
                    v-model="scriptParameters[param.name]"
                    :placeholder="`请输入${param.label}`"
                    :options="param.options"
                    :min="param.min"
                    :max="param.max"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-form>
              <div v-else class="no-parameters">
                此脚本无需参数配置
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="showScriptDialog = false">取消</el-button>
        <el-button type="primary" @click="saveScript">保存并关闭</el-button>
      </span>
    </el-dialog>

    <!-- 设置对话框 -->
    <el-dialog
      title="平台设置"
      :visible.sync="showSettings"
      width="500px"
    >
      <el-form :model="settings" label-width="120px">
        <el-form-item label="默认循环次数">
          <el-input-number
            v-model="settings.defaultLoopCount"
            :min="1"
            :max="100"
          />
        </el-form-item>
        <el-form-item label="默认间隔时间">
          <el-input-number
            v-model="settings.defaultInterval"
            :min="1"
            :max="60"
          />
          <span style="margin-left: 5px">秒</span>
        </el-form-item>
        <el-form-item label="默认超时时间">
          <el-input-number
            v-model="settings.defaultTimeout"
            :min="10"
            :max="300"
          />
          <span style="margin-left: 5px">秒</span>
        </el-form-item>
        <el-form-item label="最大并行数">
          <el-input-number
            v-model="settings.maxParallel"
            :min="1"
            :max="10"
          />
        </el-form-item>
        <el-form-item label="自动保存日志">
          <el-switch v-model="settings.autoSaveLog" />
        </el-form-item>
        <el-form-item label="日志保存路径">
          <el-input
            v-model="settings.logPath"
            :disabled="!settings.autoSaveLog"
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
      // 树形菜单数据
      treeMenus: [],
      treeProps: {
        children: 'children',
        label: 'name'
      },
      activeMenu: '',

      // 功能表格数据
      functions: [],
      selectedFunctions: [],

      // 执行控制配置
      executionConfig: {
        loopCount: 1,
        interval: 5,
        timeout: 60,
        continueOnError: false,
        executionOrder: 'sequential'
      },

      // 执行统计
      stats: {
        success: 0,
        failed: 0,
        processing: 0,
        totalTime: 0,
        progress: 0
      },

      // 控制台输出
      consoleOutput: '',
      consoleInput: '',
      executing: false,
      executionQueue: [],
      currentExecutionIndex: 0,
      totalExecutions: 0,
      currentExecutionName: '',

      // 当前编辑的脚本
      currentScript: null,
      editedScriptContent: '',
      scriptParameters: {},
      showScriptDialog: false,

      // 设置
      settings: {
        defaultLoopCount: 1,
        defaultInterval: 5,
        defaultTimeout: 60,
        maxParallel: 3,
        autoSaveLog: true,
        logPath: './logs'
      },
      showSettings: false,

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
          'F5': () => this.executeSingleScript(this.currentScript),
          'Ctrl-/': 'toggleComment',
          'Tab': 'indentMore',
          'Shift-Tab': 'indentLess'
        }
      },

      // WebSocket连接
      ws: null,
      executionTimer: null,
      autoSaveTimer: null
    }
  },

  computed: {
    // 将平面菜单转换为树形结构
    processedTreeMenus() {
      return this.menus.map(menu => ({
        id: menu.id,
        name: menu.name,
        icon: menu.icon,
        type: 'menu',
        children: menu.functions ? menu.functions.map(func => ({
          id: func.id,
          name: func.name,
          icon: func.icon,
          type: 'function',
          parentId: menu.id,
          data: func
        })) : []
      }))
    },

    // 获取菜单下的功能数量
    getMenuFunctionCount() {
      return (menuId) => {
        const menu = this.treeMenus.find(m => m.id === menuId)
        return menu && menu.children ? menu.children.length : 0
      }
    }
  },

  watch: {
    // 监听执行配置变化
    executionConfig: {
      deep: true,
      handler(newVal) {
        localStorage.setItem('execution_config', JSON.stringify(newVal))
      }
    }
  },

  async mounted() {
    // 加载树形菜单
    await this.loadTreeMenus()

    // 加载执行配置
    this.loadExecutionConfig()

    // 加载设置
    this.loadSettings()

    // 默认展开第一个菜单
    if (this.treeMenus.length > 0) {
      await this.handleNodeClick(this.treeMenus[0])
    }
  },

  beforeDestroy() {
    this.stopAllTimers()
    if (this.ws) {
      this.ws.close()
    }
  },

  methods: {
    // 加载树形菜单
    async loadTreeMenus() {
      try {
        // 这里应该调用API获取数据，暂时使用模拟数据
        this.treeMenus = this.getSimulatedTreeData()
      } catch (error) {
        console.error('加载菜单失败:', error)
        this.$message.error('加载菜单失败')
      }
    },

    // 获取模拟的树形数据
    getSimulatedTreeData() {
      return [
        {
          id: 'p1_group',
          name: '飞机监控组',
          icon: 'el-icon-s-data',
          type: 'group',
          children: [
            {
              id: 'p1',
              name: 'P1监控',
              icon: 'el-icon-monitor',
              type: 'menu',
              children: [
                {
                  id: 'flight_status',
                  name: '飞行状态监控',
                  icon: 'el-icon-s-promotion',
                  type: 'function',
                  data: {
                    name: '飞行状态监控',
                    description: '实时监控飞行状态和参数',
                    script: 'scripts/flight_status.py',
                    status: 'ready',
                    parameters: [
                      {
                        name: 'interval',
                        label: '监控间隔',
                        type: 'number',
                        default: 5,
                        min: 1,
                        max: 60
                      },
                      {
                        name: 'alert_threshold',
                        label: '告警阈值',
                        type: 'number',
                        default: 80,
                        min: 0,
                        max: 100
                      }
                    ]
                  }
                },
                {
                  id: 'engine_monitor',
                  name: '发动机监控',
                  icon: 'el-icon-fan',
                  type: 'function',
                  data: {
                    name: '发动机监控',
                    description: '监控发动机运行状态',
                    script: 'scripts/engine_monitor.py',
                    status: 'ready'
                  }
                }
              ]
            },
            {
              id: 'p2',
              name: 'P2维护',
              icon: 'el-icon-set-up',
              type: 'menu',
              children: [
                {
                  id: 'maintenance_check',
                  name: '维护检查',
                  icon: 'el-icon-s-check',
                  type: 'function',
                  data: {
                    name: '维护检查',
                    description: '定期维护检查脚本',
                    script: 'scripts/maintenance_check.py',
                    status: 'ready'
                  }
                }
              ]
            }
          ]
        },
        {
          id: 'p3_group',
          name: '数据处理组',
          icon: 'el-icon-s-data',
          type: 'group',
          children: [
            {
              id: 'p3',
              name: 'P3处理',
              icon: 'el-icon-cpu',
              type: 'menu',
              children: [
                {
                  id: 'data_processing',
                  name: '数据处理',
                  icon: 'el-icon-s-operation',
                  type: 'function',
                  data: {
                    name: '数据处理',
                    description: '数据处理和分析脚本',
                    script: 'scripts/data_processing.py',
                    status: 'ready'
                  }
                }
              ]
            }
          ]
        },
        {
          id: 'p4_group',
          name: '测试脚本组',
          icon: 'el-icon-s-data',
          type: 'group',
          children: [
            {
              id: 'p4',
              name: 'P4测试',
              icon: 'el-icon-s-opportunity',
              type: 'menu',
              children: [
                {
                  id: 'unit_test',
                  name: '单元测试',
                  icon: 'el-icon-s-claim',
                  type: 'function',
                  data: {
                    name: '单元测试',
                    description: '自动化单元测试脚本',
                    script: 'scripts/unit_test.py',
                    status: 'ready'
                  }
                },
                {
                  id: 'integration_test',
                  name: '集成测试',
                  icon: 'el-icon-s-marketing',
                  type: 'function',
                  data: {
                    name: '集成测试',
                    description: '系统集成测试脚本',
                    script: 'scripts/integration_test.py',
                    status: 'ready'
                  }
                }
              ]
            },
            {
              id: 'p5',
              name: 'P5验证',
              icon: 'el-icon-s-flag',
              type: 'menu',
              children: [
                {
                  id: 'validation_check',
                  name: '验证检查',
                  icon: 'el-icon-s-claim',
                  type: 'function',
                  data: {
                    name: '验证检查',
                    description: '系统验证检查脚本',
                    script: 'scripts/validation_check.py',
                    status: 'ready'
                  }
                }
              ]
            }
          ]
        }
      ]
    },

    // 树节点点击事件
    async handleNodeClick(node) {
      if (node.type === 'menu') {
        this.activeMenu = node.id
        await this.loadMenuFunctions(node.id)
      } else if (node.type === 'function') {
        // 如果是功能节点，可以选择它
        const func = this.functions.find(f => f.id === node.id)
        if (func) {
          this.$refs.functionTable.toggleRowSelection(func)
        }
      }
    },

    // 加载菜单功能
    async loadMenuFunctions(menuId) {
      try {
        // 查找菜单节点
        const findMenuInTree = (nodes, id) => {
          for (const node of nodes) {
            if (node.id === id && node.type === 'menu') {
              return node
            }
            if (node.children) {
              const found = findMenuInTree(node.children, id)
              if (found) return found
            }
          }
          return null
        }

        const menu = findMenuInTree(this.treeMenus, menuId)
        if (menu && menu.children) {
          this.functions = menu.children.map(child => ({
            ...child.data,
            id: child.id,
            menuId: menu.id
          }))
        } else {
          this.functions = []
        }
      } catch (error) {
        console.error('加载功能列表失败:', error)
        this.$message.error('加载功能列表失败')
      }
    },

    // 获取节点图标
    getNodeIcon(node) {
      if (node.level === 1) return 'el-icon-folder'
      if (node.level === 2) return 'el-icon-folder-opened'
      return 'el-icon-document'
    },

    // 表格选择变化
    handleSelectionChange(selection) {
      this.selectedFunctions = selection
      this.updateStats()
    },

    // 开始执行
    async startExecution() {
      if (this.selectedFunctions.length === 0) {
        this.$message.warning('请先选择要执行的脚本')
        return
      }

      this.executing = true
      this.executionQueue = [...this.selectedFunctions]
      this.totalExecutions = this.selectedFunctions.length * this.executionConfig.loopCount
      this.currentExecutionIndex = 0
      this.stats.processing = this.selectedFunctions.length

      this.logToConsole('开始执行脚本...')
      this.logToConsole(`执行配置: 循环${this.executionConfig.loopCount}次, 间隔${this.executionConfig.interval}秒`)

      if (this.executionConfig.executionOrder === 'sequential') {
        await this.executeSequentially()
      } else {
        await this.executeInParallel()
      }
    },

    // 顺序执行
    async executeSequentially() {
      for (let loop = 0; loop < this.executionConfig.loopCount; loop++) {
        if (!this.executing) break

        for (const func of this.selectedFunctions) {
          if (!this.executing) break

          this.currentExecutionName = func.name
          await this.executeSingleFunction(func, loop + 1)
          this.currentExecutionIndex++

          if (loop < this.executionConfig.loopCount - 1 ||
              this.selectedFunctions.indexOf(func) < this.selectedFunctions.length - 1) {
            await this.delay(this.executionConfig.interval * 1000)
          }
        }
      }

      this.finishExecution()
    },

    // 并行执行
    async executeInParallel() {
      const maxParallel = Math.min(
        this.settings.maxParallel,
        this.selectedFunctions.length
      )

      for (let loop = 0; loop < this.executionConfig.loopCount; loop++) {
        if (!this.executing) break

        const batches = this.chunkArray(this.selectedFunctions, maxParallel)

        for (const batch of batches) {
          if (!this.executing) break

          const promises = batch.map(func =>
            this.executeSingleFunction(func, loop + 1)
          )

          await Promise.all(promises)
          this.currentExecutionIndex += batch.length

          if (loop < this.executionConfig.loopCount - 1) {
            await this.delay(this.executionConfig.interval * 1000)
          }
        }
      }

      this.finishExecution()
    },

    // 执行单个功能
    async executeSingleFunction(func, loopIndex) {
      try {
        this.logToConsole(`开始执行: ${func.name} (第${loopIndex}次循环)`)

        // 更新功能状态
        const funcIndex = this.functions.findIndex(f => f.id === func.id)
        if (funcIndex !== -1) {
          this.$set(this.functions[funcIndex], 'status', 'processing')
        }

        // 模拟执行
        await this.delay(1000 + Math.random() * 2000)

        // 随机模拟成功或失败
        const success = Math.random() > 0.2

        if (success) {
          this.stats.success++
          this.logToConsole(`✓ ${func.name} 执行成功 (第${loopIndex}次循环)`)

          if (funcIndex !== -1) {
            this.$set(this.functions[funcIndex], 'status', 'success')
          }
        } else {
          this.stats.failed++
          this.logToConsole(`✗ ${func.name} 执行失败 (第${loopIndex}次循环)`)

          if (funcIndex !== -1) {
            this.$set(this.functions[funcIndex], 'status', 'failed')
          }

          if (!this.executionConfig.continueOnError) {
            throw new Error(`${func.name} 执行失败，停止执行`)
          }
        }

        this.stats.processing--
        this.updateProgress()
      } catch (error) {
        this.stats.failed++
        this.stats.processing--
        this.logToConsole(`✗ ${func.name} 执行出错: ${error.message}`)

        if (!this.executionConfig.continueOnError) {
          throw error
        }
      }
    },

    // 停止执行
    stopExecution() {
      this.executing = false
      this.logToConsole('执行已停止')
      this.stats.processing = 0
    },

    // 完成执行
    finishExecution() {
      this.executing = false
      this.logToConsole(`执行完成。成功: ${this.stats.success}, 失败: ${this.stats.failed}`)
      this.updateStats()
    },

    // 执行单个脚本
    async executeSingleScript(func) {
      this.logToConsole(`开始执行单个脚本: ${func.name}`)

      // 添加到执行队列
      const index = this.functions.findIndex(f => f.id === func.id)
      if (index !== -1) {
        this.$set(this.functions[index], 'status', 'processing')
      }

      try {
        // 模拟执行
        await this.delay(2000)

        this.$set(this.functions[index], 'status', 'success')
        this.logToConsole(`✓ ${func.name} 执行成功`)

        // 更新统计
        this.stats.success++
        this.updateStats()
      } catch (error) {
        this.$set(this.functions[index], 'status', 'failed')
        this.logToConsole(`✗ ${func.name} 执行失败: ${error.message}`)

        this.stats.failed++
        this.updateStats()
      }
    },

    // 查看脚本
    viewScript(func) {
      this.currentScript = { ...func }
      this.editedScriptContent = `# ${func.name}\n# ${func.description}\n\nprint("Hello from ${func.name}")`
      this.scriptParameters = {}

      if (func.parameters) {
        func.parameters.forEach(param => {
          this.scriptParameters[param.name] = param.default || ''
        })
      }

      this.showScriptDialog = true
    },

    // 编辑脚本
    editScript(func) {
      this.viewScript(func)
    },

    // 保存脚本
    async saveScript() {
      if (!this.currentScript) return

      try {
        // 这里应该调用API保存脚本
        this.$message.success('脚本保存成功')
        this.showScriptDialog = false
      } catch (error) {
        this.$message.error('保存失败: ' + error.message)
      }
    },

    // 清空控制台
    clearConsole() {
      this.consoleOutput = ''
      this.$message.success('控制台已清空')
    },

    // 清空选择
    clearSelection() {
      this.$refs.functionTable.clearSelection()
      this.selectedFunctions = []
      this.updateStats()
    },

    // 导出选择
    exportSelection() {
      if (this.selectedFunctions.length === 0) {
        this.$message.warning('请先选择要导出的脚本')
        return
      }

      const data = JSON.stringify(this.selectedFunctions, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scripts_selection_${new Date().getTime()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      this.$message.success(`已导出${this.selectedFunctions.length}个脚本`)
    },

    // 复制控制台内容
    copyConsoleContent() {
      const textarea = document.createElement('textarea')
      textarea.value = this.consoleOutput
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      this.$message.success('控制台内容已复制到剪贴板')
    },

    // 下载控制台日志
    downloadConsoleLog() {
      const blob = new Blob([this.consoleOutput], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `console_log_${new Date().getTime()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      this.$message.success('日志已下载')
    },

    // 处理控制台命令
    handleConsoleCommand() {
      const command = this.consoleInput.trim()
      if (!command) return

      this.logToConsole(`> ${command}`)

      // 处理命令
      switch (command.toLowerCase()) {
        case 'help':
          this.logToConsole('可用命令: clear, stats, stop, pause, resume')
          break
        case 'clear':
          this.clearConsole()
          break
        case 'stats':
          this.logToConsole(`统计信息: 成功 ${this.stats.success}, 失败 ${this.stats.failed}, 进行中 ${this.stats.processing}`)
          break
        case 'stop':
          if (this.executing) {
            this.stopExecution()
          }
          break
        default:
          this.logToConsole(`未知命令: ${command}`)
      }

      this.consoleInput = ''
    },

    // 记录到控制台
    logToConsole(message) {
      const timestamp = new Date().toLocaleTimeString()
      this.consoleOutput += `[${timestamp}] ${message}\n`
      this.$nextTick(() => {
        this.scrollConsoleToBottom()
      })
    },

    // 滚动控制台到底部
    scrollConsoleToBottom() {
      const container = this.$refs.consoleContent
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    },

    // 更新统计
    updateStats() {
      const total = this.selectedFunctions.length
      const processed = this.stats.success + this.stats.failed
      this.stats.progress = total > 0 ? Math.round((processed / total) * 100) : 0
    },

    // 更新进度
    updateProgress() {
      const total = this.totalExecutions
      const processed = this.currentExecutionIndex
      this.stats.progress = total > 0 ? Math.round((processed / total) * 100) : 0
    },

    // 获取状态类型
    getStatusType(status) {
      switch (status) {
        case 'success': return 'success'
        case 'failed': return 'danger'
        case 'processing': return 'warning'
        default: return 'info'
      }
    },

    // 获取状态文本
    getStatusText(status) {
      switch (status) {
        case 'success': return '成功'
        case 'failed': return '失败'
        case 'processing': return '执行中'
        default: return '就绪'
      }
    },

    // 格式化持续时间
    formatDuration(ms) {
      const seconds = Math.floor(ms / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)

      if (hours > 0) {
        return `${hours}h ${minutes % 60}m`
      } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`
      } else {
        return `${seconds}s`
      }
    },

    // 获取参数组件
    getParameterComponent(type) {
      switch (type) {
        case 'number': return 'el-input-number'
        case 'boolean': return 'el-switch'
        case 'select': return 'el-select'
        default: return 'el-input'
      }
    },

    // 加载执行配置
    loadExecutionConfig() {
      const saved = localStorage.getItem('execution_config')
      if (saved) {
        this.executionConfig = { ...this.executionConfig, ...JSON.parse(saved) }
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
      await this.loadTreeMenus()
      if (this.activeMenu) {
        await this.loadMenuFunctions(this.activeMenu)
      }
      this.$message.success('数据已刷新')
    },

    // 重新加载脚本
    reloadScript() {
      // 这里应该重新从服务器加载脚本内容
      this.$message.info('重新加载脚本')
    },

    // 保存编辑的脚本
    saveEditedScript() {
      // 这里应该调用API保存脚本
      this.$message.success('脚本已保存')
    },

    // 延迟函数
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },

    // 数组分块
    chunkArray(array, size) {
      const chunks = []
      for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
      }
      return chunks
    },

    // 停止所有计时器
    stopAllTimers() {
      if (this.executionTimer) {
        clearTimeout(this.executionTimer)
        this.executionTimer = null
      }
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer)
        this.autoSaveTimer = null
      }
    }
  }
}
</script>

<style scoped>
.script-platform {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f5f7fa;
}

.menu-sidebar {
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e6e6e6;
  background: #fafafa;
}

.sidebar-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu-scrollbar {
  flex: 1;
  padding: 10px 0;
}

.menu-scrollbar >>> .el-scrollbar__wrap {
  overflow-x: hidden;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.tree-node-content i {
  width: 16px;
  text-align: center;
}

.tree-node-label {
  flex: 1;
}

.tree-node-badge {
  margin-left: 8px;
}

.el-tree >>> .el-tree-node__content {
  height: 36px;
}

.el-tree >>> .el-tree-node.is-current > .el-tree-node__content {
  background-color: #ecf5ff;
  color: #409eff;
}

.sidebar-footer {
  padding: 15px;
  border-top: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-around;
  background: #fafafa;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
}

.execution-control {
  margin-bottom: 20px;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.control-header h3 {
  margin: 0;
  color: #333;
}

.control-actions {
  display: flex;
  gap: 10px;
}

.execution-config {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.execution-stats {
  background: #fff;
  border-radius: 4px;
  padding: 15px;
  border: 1px solid #ebeef5;
}

.stat-item {
  text-align: center;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.error {
  color: #f56c6c;
}

.stat-value.processing {
  color: #e6a23c;
}

.table-section {
  flex: 1;
  margin-bottom: 20px;
  min-height: 300px;
}

.table-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.console-section {
  height: 300px;
}

.console-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.console-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  border-radius: 4px;
  position: relative;
}

.console-output {
  flex: 1;
  padding: 15px;
  margin: 0;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-y: auto;
  overflow-x: hidden;
}

.console-output.executing {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(64, 158, 255, 0.1) 100%
  );
}

.console-status {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
}

.console-footer {
  margin-top: 10px;
}

.script-dialog-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.no-parameters {
  text-align: center;
  color: #909399;
  padding: 40px 20px;
  font-size: 14px;
}

.script-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.script-name-cell i {
  color: #409eff;
}

.el-card .el-card__header {
  padding: 15px 20px;
}

.el-card .el-card__body {
  flex: 1;
  padding: 20px;
}

.execution-control .el-card__body {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.table-card .el-card__body {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.console-card .el-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
