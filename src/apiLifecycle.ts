import { currentApp, currentInstance } from './shared/instance';
import { ComponentInternalInstance } from './shared/internal';
import { bindHooks, getListeners } from './shared/lifecycle';
import { IAnyFunction } from './shared/types';
import { handleError } from './vue/errorHandling';

/**
 * 生命周期回调—监听小程序显示
 *
 * 小程序启动，或从后台进入前台显示时
 */
export const onAppShow =
  createAppHook<WechatMiniprogram.App.Option['onShow']>('onAppShow');

/**
 * 生命周期回调—监听小程序隐藏
 *
 * 小程序从前台进入后台时
 */
export const onAppHide =
  createAppHook<WechatMiniprogram.App.Option['onHide']>('onAppHide');

/**
 * 错误监听函数
 *
 * 小程序发生脚本错误，或者 api
 */
export const onAppError =
  createAppHook<WechatMiniprogram.App.Option['onError']>('onAppError');

/**
 * 页面不存在监听函数
 *
 * 小程序要打开的页面不存在时触发，会带上页面信息回调该函数
 *
 * **注意：**
 * 1. 如果开发者没有添加 `onPageNotFound` 监听，当跳转页面不存在时，将推入微信客户端原生的页面不存在提示页面。
 * 2. 如果 `onPageNotFound` 回调中又重定向到另一个不存在的页面，将推入微信客户端原生的页面不存在提示页面，并且不再回调 `onPageNotFound`。
 *
 * 最低基础库： 1.9.90
 */
export const onPageNotFound =
  createAppHook<WechatMiniprogram.App.Option['onPageNotFound']>(
    'onPageNotFound',
  );

/**
 * 小程序有未处理的 Promise 拒绝时触发。也可以使用 [wx.onUnhandledRejection](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html) 绑定监听。注意事项请参考 [wx.onUnhandledRejection](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html)。
 * **参数**：与 [wx.onUnhandledRejection](https://developers.weixin.qq.com/miniprogram/dev/api/base/app/app-event/wx.onUnhandledRejection.html) 一致
 */
export const onUnhandledRejection = createAppHook<
  WechatMiniprogram.App.Option['onUnhandledRejection']
>('onUnhandledRejection');

/**
 * 系统切换主题时触发。也可以使用 wx.onThemeChange 绑定监听。
 *
 * 最低基础库： 2.11.0
 */
export const onThemeChange =
  createAppHook<WechatMiniprogram.App.Option['onThemeChange']>('onThemeChange');

/**
 * 在组件实例被从页面节点树移除时执行
 *
 * 最低基础库版本：[`1.6.3`](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility.html)
 */
export const onDetached =
  createComponentHook<
    NonNullable<WechatMiniprogram.Component.Lifetimes['lifetimes']['detached']>
  >('onDetached');

/**
 * 在组件在视图层布局完成后执行
 *
 * 最低基础库版本：[`1.6.3`](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility.html)
 */
export const onReady =
  createComponentHook<
    NonNullable<WechatMiniprogram.Component.Lifetimes['lifetimes']['ready']>
  >('onReady');

/**
 * 在组件实例被移动到节点树另一个位置时执行
 *
 * 最低基础库版本：[`1.6.3`](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility.html)
 */
export const onMoved =
  createComponentHook<
    NonNullable<WechatMiniprogram.Component.Lifetimes['lifetimes']['moved']>
  >('onMoved');

/**
 * 每当组件方法抛出错误时执行
 *
 * 最低基础库版本：[`2.4.1`](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility.html)
 */
export const onError =
  createComponentHook<
    NonNullable<WechatMiniprogram.Component.Lifetimes['lifetimes']['error']>
  >('onError');

/**
 * 生命周期回调—监听页面加载
 *
 * 页面加载时触发。一个页面只会调用一次，可以在 onLoad 的参数中获取打开当前页面路径中的参数。
 */
export const onLoad =
  createComponentHook<WechatMiniprogram.Page.ILifetime['onLoad']>('onLoad');

/**
 * 生命周期回调—监听页面显示
 *
 * 页面显示/切入前台时触发。
 */
export const onShow =
  createComponentHook<WechatMiniprogram.Page.ILifetime['onShow']>('onShow');

/**
 * 生命周期回调—监听页面隐藏
 *
 * 页面隐藏/切入后台时触发。 如 `navigateTo` 或底部 `tab` 切换到其他页面，小程序切入后台等。
 */
export const onHide =
  createComponentHook<WechatMiniprogram.Page.ILifetime['onHide']>('onHide');

/**
 * 生命周期回调—监听页面卸载
 *
 * 页面卸载时触发。如`redirectTo`或`navigateBack`到其他页面时。
 */
export const onUnload =
  createComponentHook<WechatMiniprogram.Page.ILifetime['onUnload']>('onUnload');

/**
 * 路由动画完成时触发
 *
 * 如 wx.navigateTo 页面完全推入后 或 wx.navigateBack 页面完全恢复时。
 */
export const onRouteDone = createComponentHook('onRouteDone');

/**
 * 监听用户下拉动作
 *
 * 监听用户下拉刷新事件。
 * - 需要在`app.json`的`window`选项中或页面配置中开启`enablePullDownRefresh`。
 * - 可以通过`wx.startPullDownRefresh`触发下拉刷新，调用后触发下拉刷新动画，效果与用户手动下拉刷新一致。
 * - 当处理完数据刷新后，`wx.stopPullDownRefresh`可以停止当前页面的下拉刷新。
 */
export const onPullDownRefresh =
  createComponentHook<WechatMiniprogram.Page.ILifetime['onPullDownRefresh']>(
    'onPullDownRefresh',
  );

/**
 * 页面上拉触底事件的处理函数
 *
 * 监听用户上拉触底事件。
 * - 可以在`app.json`的`window`选项中或页面配置中设置触发距离`onReachBottomDistance`。
 * - 在触发距离内滑动期间，本事件只会被触发一次。
 */
export const onReachBottom =
  createComponentHook<WechatMiniprogram.Page.ILifetime['onReachBottom']>(
    'onReachBottom',
  );

/**
 * 页面滚动触发事件的处理函数
 *
 * 监听用户滑动页面事件。
 */
export const onPageScroll =
  createComponentHook<WechatMiniprogram.Page.ILifetime['onPageScroll']>(
    'onPageScroll',
  );

/**
 * 监听用户点击右上角菜单“收藏”按钮的行为，并自定义收藏内容。
 * 基础库 2.10.3，安卓 7.0.15 版本起支持，iOS 暂不支持
 */
export const onAddToFavorites = createComponentHook<
  WechatMiniprogram.Page.ILifetime['onAddToFavorites']
>('onAddToFavorites', true);

/**
 * 用户点击右上角转发
 *
 * 监听用户点击页面内转发按钮（`<button>` 组件 `open-type="share"`）或右上角菜单“转发”按钮的行为，并自定义转发内容。
 *
 * **注意：只有定义了此事件处理函数，右上角菜单才会显示“转发”按钮**
 *
 * 此事件需要 return 一个 Object，用于自定义转发内容
 */
export const onShareAppMessage = createComponentHook<
  WechatMiniprogram.Page.ILifetime['onShareAppMessage']
>('onShareAppMessage', true);

/**
 * 监听右上角菜单“分享到朋友圈”按钮的行为，并自定义分享内容
 *
 * 本接口为 Beta 版本，暂只在 Android 平台支持，详见 [分享到朋友圈 (Beta)](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/share-timeline.html)
 *
 * 基础库 2.11.3 开始支持，低版本需做兼容处理。
 */
export const onShareTimeline = createComponentHook<
  WechatMiniprogram.Page.ILifetime['onShareTimeline']
>('onShareTimeline', true);

/**
 * 窗口尺寸改变时触发，最低基础库：`2.4.0`
 */
export const onResize =
  createComponentHook<WechatMiniprogram.Page.ILifetime['onResize']>('onResize');

/**
 * 当前是 tab 页时，点击 tab 时触发，最低基础库： `1.9.0`
 */
export const onTabItemTap =
  createComponentHook<WechatMiniprogram.Page.ILifetime['onTabItemTap']>(
    'onTabItemTap',
  );

export interface ISaveExitStateContent {
  /**
   * 需要保存的数据（只能是 JSON 兼容的数据） */
  data: unknown;
  /**
   * 超时时刻，在这个时刻后，保存的数据保证一定被丢弃，默认为 (当前时刻 + 1 天) */
  expireTimeStamp?: number;
}

/**
 * 每当小程序可能被销毁之前，页面回调函数 onSaveExitState 会被调用，可以进行退出状态的保存。
 */
export const onSaveExitState =
  createComponentHook<() => ISaveExitStateContent | undefined>(
    'onSaveExitState',
  );

function createAppHook<T extends IAnyFunction>(lifecycle: string) {
  return (callback: T) => {
    if (currentApp) {
      bindHooks(currentApp, lifecycle, callback);
    } else if (__DEV__) {
      warnMissingContext(lifecycle);
    }
  };
}

function createComponentHook<T extends IAnyFunction = () => void>(
  lifecycle: string,
  ensureUnique?: boolean,
) {
  return (callback: T) => {
    if (!currentInstance) {
      if (__DEV__) {
        warnMissingContext(lifecycle, currentInstance);
      }
      return;
    }
    if (ensureUnique) {
      const listeners = getListeners(currentInstance.instance, lifecycle);
      if (listeners?.length) {
        handleError(
          new Error(`${lifecycle} is registered more than once`),
          currentInstance,
          lifecycle,
        );
      }
    }
    bindHooks(currentInstance.instance, lifecycle, callback);
  };
}

function warnMissingContext(
  hookName: string,
  instance?: ComponentInternalInstance,
) {
  handleError(
    new Error(
      `${hookName} is called when there is no active component instance to be ` +
        `associated with. ` +
        `Lifecycle injection APIs can only be used during execution of setup().`,
    ),
    instance,
    hookName,
  );
}
