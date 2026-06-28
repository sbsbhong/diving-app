import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {
  DEFAULT_WHEEL_HEIGHT,
  ITEM_HEIGHT,
  NumberWheelPicker,
  getWheelLayout,
} from '../src/components/ui/number-wheel-picker';

const renderers: ReactTestRenderer.ReactTestRenderer[] = [];

afterEach(async () => {
  await ReactTestRenderer.act(async () => {
    for (const renderer of renderers.splice(0)) {
      renderer.unmount();
    }
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });
});

describe('NumberWheelPicker', () => {
  it('uses a 176px default wheel height with five visible candidates', async () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NumberWheelPicker value={10} min={0} max={20} step={5} unitLabel="m" onChange={onChange} testID="depth-picker" />,
      );
    });
    renderers.push(renderer!);

    const wheel = renderer!.root.findByProps({ testID: 'depth-picker-wheel' });
    const list = renderer!.root.findByProps({ testID: 'depth-picker-wheel-list' });

    expect(ITEM_HEIGHT).toBe(36);
    expect(DEFAULT_WHEEL_HEIGHT).toBe(176);
    expect(wheel.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ height: 176 })]));
    expect(list.props.snapToInterval).toBe(36);
    expect(list.props.contentContainerStyle).toEqual(expect.arrayContaining([expect.objectContaining({ paddingVertical: 70 })]));
  });

  it('derives visible candidate counts from custom picker heights', () => {
    expect(getWheelLayout(132)).toEqual({ wheelHeight: 132, visibleItemCount: 3, centerPadding: 48 });
    expect(getWheelLayout(176)).toEqual({ wheelHeight: 176, visibleItemCount: 5, centerPadding: 70 });
    expect(getWheelLayout(220)).toEqual({ wheelHeight: 220, visibleItemCount: 7, centerPadding: 92 });
    expect(getWheelLayout(80)).toEqual({ wheelHeight: 108, visibleItemCount: 3, centerPadding: 36 });
  });

  it('supports compound Root, Wheel, SelectionOverlay, and CenterInputTrigger composition', async () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NumberWheelPicker.Root value={10} min={0} max={20} step={5} unitLabel="m" onChange={onChange} testID="depth-picker">
          <NumberWheelPicker.Wheel />
          <NumberWheelPicker.SelectionOverlay />
          <NumberWheelPicker.CenterInputTrigger />
        </NumberWheelPicker.Root>,
      );
    });
    renderers.push(renderer!);

    const list = renderer!.root.findByProps({ testID: 'depth-picker-wheel-list' });
    expect(list.props.snapToInterval).toBe(ITEM_HEIGHT);
    expect(renderer!.root.findByProps({ testID: 'depth-picker-value' }).props.children).toBe('10');

    await ReactTestRenderer.act(async () => {
      list.props.onScroll({ nativeEvent: { contentOffset: { y: ITEM_HEIGHT * 3 } } });
    });

    expect(onChange).toHaveBeenCalledWith(15);
    expect(renderer!.root.findByProps({ testID: 'depth-picker-value' }).props.children).toBe('15');
  });

  it('renders a vertical snapping wheel from min to max using step', async () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NumberWheelPicker value={10} min={0} max={20} step={5} unitLabel="m" onChange={onChange} testID="depth-picker" />,
      );
    });
    renderers.push(renderer!);

    const list = renderer!.root.findByProps({ testID: 'depth-picker-wheel-list' });

    expect(list.props.data).toEqual([0, 5, 10, 15, 20]);
    expect(list.props.getItemLayout(undefined, 3)).toEqual({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * 3, index: 3 });
    expect(list.props.snapToInterval).toBe(ITEM_HEIGHT);
    expect(list.props.scrollEventThrottle).toBe(16);
    expect(list.props.showsVerticalScrollIndicator).toBe(false);
    expect(renderer!.root.findByProps({ testID: 'depth-picker-value' }).props.children).toBe('10');
    expect(renderer!.root.findByProps({ testID: 'depth-picker-unit' }).props.children).toBe('m');
  });

  it('renders option rows with separate value and unit columns', async () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NumberWheelPicker value={150} min={148} max={152} step={1} unitLabel="m" onChange={onChange} testID="depth-picker" />,
      );
    });
    renderers.push(renderer!);

    expect(renderer!.root.findByProps({ testID: 'depth-picker-option-150-value' }).props.children).toBe('150');
    expect(renderer!.root.findByProps({ testID: 'depth-picker-option-150-unit' }).props.children).toBe('m');
    expect(renderer!.root.findByProps({ testID: 'depth-picker-center-value-column' })).toBeTruthy();
    expect(renderer!.root.findByProps({ testID: 'depth-picker-center-unit-column' })).toBeTruthy();
  });

  it('selects the nearest value when momentum scrolling ends', async () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NumberWheelPicker value={10} min={0} max={20} step={5} unitLabel="m" onChange={onChange} testID="depth-picker" />,
      );
    });
    renderers.push(renderer!);

    const list = renderer!.root.findByProps({ testID: 'depth-picker-wheel-list' });

    await ReactTestRenderer.act(async () => {
      list.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { y: ITEM_HEIGHT * 3.2 } } });
    });

    expect(onChange).toHaveBeenCalledWith(15);
  });

  it('updates the centered value while the wheel is scrolling', async () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NumberWheelPicker value={10} min={0} max={20} step={5} unitLabel="m" onChange={onChange} testID="depth-picker" />,
      );
    });
    renderers.push(renderer!);

    const list = renderer!.root.findByProps({ testID: 'depth-picker-wheel-list' });

    await ReactTestRenderer.act(async () => {
      list.props.onScroll({ nativeEvent: { contentOffset: { y: ITEM_HEIGHT * 3 } } });
    });

    expect(onChange).toHaveBeenCalledWith(15);
    expect(renderer!.root.findByProps({ testID: 'depth-picker-value' }).props.children).toBe('15');
  });

  it('accepts decimal keyboard entry when valueType is float', async () => {
    const onChange = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <NumberWheelPicker value={0} min={0} max={40} step={0.1} unitLabel="m" valueType="float" onChange={onChange} testID="depth-picker" />,
      );
    });
    renderers.push(renderer!);

    const root = renderer!.root;

    await ReactTestRenderer.act(async () => {
      root.findByProps({ testID: 'depth-picker-input-trigger' }).props.onPress();
    });

    const input = root.findAllByProps({ testID: 'depth-picker-input' }).find(match => typeof match.props.onChangeText === 'function');
    expect(input).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      input!.props.onChangeText('15.');
      input!.props.onChangeText('15.3');
    });

    const updatedInput = root.findAllByProps({ testID: 'depth-picker-input' }).find(match => typeof match.props.onSubmitEditing === 'function');
    await ReactTestRenderer.act(async () => {
      updatedInput!.props.onSubmitEditing();
    });

    expect(onChange).toHaveBeenCalledWith(15.3);
  });
});
